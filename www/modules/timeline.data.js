/// convienience
var store
///

/// localStorage cache/crypto wrappers
var __ifs_getfile
var __ifs_getfilelist
var __ifs_putfile
var __ifs_putfilelist
var __ifs_getv

TL.Data = {

	/// capserver gore ahead

	store: null, // initialized by TL.Install
	
	password: null, // crypto password
	
	crypto: false, // use crypto?
		
	cache: {},
		
	Now: function(){
		return Math.floor(new Date().getTime()/1000)
	},
	
	HashEvent: function(event){
		return MD5(''+(new Date().getTime())+(event.start)+(event.description))
	},
	

	GetRootNS:function(callback){
		store.getns(null, {onResponse:function(ns_res){
			store.getfilelist(ns_res.data, {onResponse: function(fl_res){ callback(fl_res.data) }})
		}})
	},
	
	PutRootPtr:function(refcap, callback){
		TL.Data.GetRootNS(function(ns){
			// update 'data' ptr
			store.putptr(ns.file(1).ptr(), refcap, {onResponse:callback}) 
		})
	},
	
	DeRefPtr:function(ptr_cap, callback){
		window.ptr = ptr_cap
		store.getptr(ptr_cap, {onResponse:function(p_res){
		if(!p_res.data) return callback(null)
		store.getv(p_res.data, {onResponse: function(v_res){ callback(v_res.data) }})
		}})
	},
	
	GetAppData:function(callback){
	    
	    // no crypto, no caching
	    
	    vpt_appns({complete: function(ns){
	        if(!ns){
	            console.log('GetAppData: app ns is null');
	            return;
	        }
	        callback(ns.meta(), ns)
	    }})
	    
	    /*
		TL.Data.GetRootNS(function(ns){
			if(!ns) return callback(null)
			TL.Data.DeRefPtr(ns.file(1).ptr(), function(app_ns){
				if(!app_ns) return callback(null,null)
				callback(app_ns.meta(), app_ns)
			})
		})
		*/
		
	},
	
	PutAppData: function(data, app_ns, callback){
		
		app_ns.meta(data)
		
		// no crypto, no caching
		
		vpt_appns(app_ns, {complete: function(ns){

		    callback(data, ns)
		}})

		
		/*
		store.putfilelist(app_ns, {onResponse: function(res){
			TL.Data.PutRootPtr(res.data, function(){
				callback(data, app_ns)
			})
			
		}})
		*/
		
	},
	
	// DEPRECATED: see vpt_install()
	InstallAppData: function(data, callback){
		var app_ns = new ifs.objects.CapList()
		TL.Data.PutAppData(data, app_ns, callback)
	},
	
	GetSourceEvents:function(srv_id, srv_ptr, callback){
		TL.Data.DeRefPtr(srv_ptr, function(srv_ns){
		if(!srv_ns) callback(srv_id,null,[],null)
		
		var srv_data, srv_events = [], srv_event_count = srv_ns.length() - 1
		
		function complete(){ callback(srv_id, srv_data,srv_events,srv_ns) }
		
		function event_loaded(res){
			srv_events.push(JSON.parse(res.data.val))
			if(--srv_event_count == 0) complete()
		}
		
		TL.Data.DeRefPtr(srv_ns.file(0).ptr(), function(blob_res){
			srv_data = JSON.parse(blob_res.data.val)
			
			if(srv_ns.length() == 1) 
			return complete()
			
			for(var k = 1; k < srv_ns.length(); k++)
			store.getfile(srv_ns.file(k).ptr(), {onResponse:event_loaded})
		})
		
		})
	},
	
	PutSourceData: function(srv_data_ptr, data, callback){
		store.putfile(JSON.stringify(data), {onResponse:function(res){
		store.putptr(srv_data_ptr, res.data, {onResponse:function(){
		callback(res.data)
		}})		
		}})

	},
	
	PutSourceEvents:function(srv_ns_ptr, srv_ns, events, callback, progress){
		var event_count = events.length
		var event_caps = {}
		
		function date_to_time(date){
			if(!date) return 0
			
			if(date instanceof Date)
			return Math.floor(date.getTime()/1000)
			if(typeof date == 'number')
			return date
			return Math.floor(Date.parse(date)/1000)
			
		}

		function event_uploaded(index, event_cap, res){
		    
		    //progress.setProgress((events.length - event_count)/events.length);
		    
		    if(!event_cap){
		        console.log('PutSourceEvents: PUT failed ['+index+'] :: ' + JSON.stringify(res));
		        
		        if(--event_count == 0) update_ns()
		        
		        return;
		    }
		
			var e = events[index]
			event_caps[index] = event_cap
			
			var meta = {'start':date_to_time(e.start), 'end':date_to_time(e.end)}
			if(e.color)
				meta['color'] = e.color
			if(e.rule)
				meta['rule'] = JSON.stringify(e.rule)		   
						  
						  
			var ent = srv_ns.add(event_cap)
			ent.meta(meta)
			
			if(--event_count == 0) update_ns()	
		}
		
		function update_ns(){
		    console.log('PutSourceEvents: updating service ns = ', srv_ns);
			store.putfilelist(srv_ns, {onResponse:function(res){
			    console.log('--->putfilelist: ', res);
			    store.putptr(srv_ns_ptr, res.data, {onResponse: function(resp){
			    console.log('--->putptr: ', resp);
				    callback(srv_ns, res.data, event_caps)
			    }})
			}})	
		}		
		
		if(!events.length) 
		return callback(srv_ns,null)
		
		
		for(var k=0;k < events.length;k++){
			if(!events[k].hash)
				events[k].hash = TL.Data.HashEvent(events[k])
			store.putfile(JSON.stringify(events[k]), 
			    {timeout: 30000, 
			     onResponse: eval('(function(res){event_uploaded('+k+',res.data,res)})')})
		}
	},
	
	AddSource: function(srv_id, srv_data, callback){
		
		TL.Data.GetAppData(function(app_data, app_ns){
		
		store.putfile(JSON.stringify(srv_data), {onResponse: function(srv_data_cap){
		store.mkptr(srv_data_cap.data, {onResponse:function(srv_data_ptr){
		
		var srv_ns = new ifs.objects.CapList()
		srv_ns.add(srv_data_ptr.data)
		
		store.putfilelist(srv_ns, {onResponse:function(srv_ns_cap){
		store.mkptr(srv_ns_cap.data, {onResponse:function(srv_ns_ptr){
		
		var ent = app_ns.add(srv_ns_ptr.data)
		ent.meta( {'id': srv_id} )
		
		vpt_appns(app_ns, {complete: function(){
		    callback(srv_id,srv_data,srv_ns_ptr.data,srv_ns)
		}})
		
		/*
		store.putfilelist(app_ns, {onResponse:function(app_ns_cap){
			TL.Data.PutRootPtr(app_ns_cap.data, function(){
				callback(srv_id,srv_data,srv_ns_ptr.data,srv_ns)
			})
		
		}})*/ }}) }}) }}) }}) // yea
		
		})
		
	},
	
	DelSource:function(srv_id, callback){
		TL.Data.GetAppData(function(app_data, app_ns){
		
		var new_app_ns = new ifs.objects.CapList()
		new_app_ns.meta( app_ns.meta() )
		
		var indices = JSON.parse(new_app_ns.meta()['indices'])
		delete indices[srv_id]
		new_app_ns.meta()['indices'] = JSON.stringify(indices)
		
		for(var k = 0; k < app_ns.length(); k++){
			var oent = app_ns.file(k)
			if(oent.meta()['id'] != srv_id){
				  
				var nent = new_app_ns.add( oent.ptr() )
				nent.meta( oent.meta() )

			}
		}
		
		vpt_appns(new_app_ns, {complete: callback})
		
		/*
		store.putfilelist(new_app_ns, {onResponse:function(app_ns_cap){
			TL.Data.PutRootPtr(app_ns_cap.data, callback)
		}})
		*/
		
		})
	},
	
	EnableCache: function(){
	
		__ifs_getv = store.getv	
		__ifs_getfile = store.getfile
		__ifs_putfile = store.putfile
 		__ifs_getfilelist = store.getfilelist
 		__ifs_putfilelist = store.putfilelist
 	
 	
 		store.getv = function(cap, cb){
 			var ref = cap.opts()['ref']
 			if(ref.indexOf('BLOB') != -1)
 				return store.getfile(cap, cb)
 			if(ref.indexOf('LIST') != -1)
 				return store.getfilelist(cap, cb)
 			__ifs_getv.call(store, cap, cb)
 		}
	
		store.getfile = function(cap, cb){
		
			//console.log('getfile(): ' + cap.pack())
		    /*
			if(cap.opts()['ref'] in localStorage){
				return cb.onResponse({'data':{'val':localStorage[cap.opts()['ref']]}})
			}
			__ifs_getfile.call(store, cap, {onResponse: function(res){
				if(!TL.Data.crypto){
					localStorage[cap.opts()['ref']] = res.data.val
					cb.onResponse(res)
				}else{
					var pt = sjcl.decrypt(TL.Data.password, res.data.val)
					localStorage[cap.opts()['ref']] = pt
					cb.onResponse({'data':{'val':pt}})
				}
			}})
			*/
			__ifs_getfile.call(store, cap, {onResponse: function(res){
			    var pt = sjcl.decrypt(TL.Data.password, res.data.val)
			    cb.onResponse({'data':{'val':pt}})
			}})
			 
		}
		
		store.putfile = function(blob, cb){
		
			//console.log('putfile()')
			var ct = sjcl.encrypt(TL.Data.password, blob)
			
			// opportunity for pre-caching here
			__ifs_putfile.call(store, ct, cb)
		}

		store.getfilelist = function(cap, cb){
		
			//console.log('getfilelist(): ' + cap.pack())
			
			if(cap.opts()['ref'] in localStorage){
				//console.log(' --> cache hit.')
				//print_list(ifs.objects.CapList.fromStr(localStorage[cap.opts()['ref']]))
				return cb.onResponse({'data': ifs.objects.CapList.fromStr(localStorage[cap.opts()['ref']])})
			}
			
			//console.log(' --> cache miss.')
			__ifs_getfilelist.call(store, cap, {onResponse: function(res){
					function decrypt_meta(emeta){
						
						var pmeta = {}
						
						for(var k in emeta){
							if(k == '__crypt') continue;
							
							var key = sjcl.decrypt(TL.Data.password, atob(k) )
							var val = sjcl.decrypt(TL.Data.password, atob(emeta[k]))
							
							if(/^[0-9]+$/.test(val))
								val = parseInt(val)
							
							pmeta[ key ] = val
						}
						
						return pmeta
						
					}
					
					
					var list = res.data
					
					if('__crypt' in list.meta()){
						list.meta(decrypt_meta(list.meta()))
						for(var i=0; i < list.length(); i++){
							list.file(i).meta(decrypt_meta(list.file(i).meta()))
						}
						list.meta()['__crypt'] = 1
					}
					
					try{
					    localStorage[cap.opts()['ref']] = list.pack()
					}catch(e){
					    console.log('LocalStorage capacity reached.');
					}
					
					res.data = list
					
					cb.onResponse(res)
				
			}})
		}
		
		store.putfilelist = function(list, cb){
		
			//console.log('putfilelist()')
			
			function encrypt_meta(pmeta){
				
				var emeta = {}
				
				for(var k in pmeta){
					
					if(k == '_crypt') continue;
					
					emeta[ btoa(sjcl.encrypt(TL.Data.password, k)) ]
							= btoa(sjcl.encrypt(TL.Data.password, ''+pmeta[k]))
			
				}
				
				return emeta
				
			}
			
			if(TL.Data.crypto){
				list.meta(encrypt_meta(list.meta()))
				for(var i = 0; i < list.length(); i++){
					list.file(i).meta(encrypt_meta(list.file(i).meta()))
				}
				list.meta()['__crypt'] = 1
			}	
			
			// opportunity for pre-caching here
			__ifs_putfilelist.call(store, list, cb)
			
		}
		
	
	},
	
	EnableCrypto: function(mypass){
		TL.Data.password = mypass
		TL.Data.crypto = true
	}
			
	
} // TL.Data



