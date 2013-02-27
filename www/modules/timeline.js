/**
 * Timeline App 
 * 
 * This app allows you to sync various services (Facebook, Google Calendar, Flickr)
 * with IFS and provides a temporal visualization of your data as events.
 *
 * Credits: SIMILE project Timeline widget: http://www.simile-widgets.org/timeline/
 *
**/



/*
 * Some extentions to the native Array
**/
// Remove an element at some index
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

// Return an array of unique elements (set)
Array.prototype.unique = function(){
	var set = []
	for(var i=0; i < this.length; i++){
		if(set.indexOf(this[i]) == -1)
			set.push(this[i])
	}
	return set
}

// Return an array of the values of some property on each element
Array.pick = function(a,key){
	var res = []
	for(var i=0;i<a.length;i++){
		if(key in a[i]) res.push(a[i][key])
	}
	return res
};

// Return an array of an object's keys
Object.keys = function(o){
	var keys = []
	for(var key in o) keys.push(key)
	return keys
}

Object.values = function(o){
	var vals = []
	
	if(!o)
	return vals
	
	for(var k in o)
		vals.push(o[k])
	
	return vals
}

Object.objectArray = function(o){
	delete o['length']
	return Object.values(o)	
}

/*
 * The Timline (TL) namespace.
 * This is the root namespace of the application. Functions and handles are
 * shared by the other namespaces.
 *
 * See also: TL.UI <timeline.ui.js> and TL.Data <timeline.data.js>
 *
**/

/// Capservice handle for convienience
var store

var TL = {

	// timing interval for automatic, periodic sync/update
	LiveSyncInterval: null,
	LiveSyncDelay: 60*20*1000, // 20 min
	// hashes of objects that are in the timeline (to avoid duplicates)
	EventHashTable: {},
	// registered service plugins
	SourcesAvailable: [],
	// plugins that are actually installed/active
	SourcesInstalled: {},

	// Registered and installed apps/analyzers
	AppsAvailable: [],
	AppsInstalled: {},

	// queue of services to add
	AddSourcesQueue: [],
	
	SourceEventCache: {},
	
	// Dynamic paging of events in the stream
	StreamPage: 0,
	
	Install: function(){
		TL.Activate()
	},
	
	// Checks if app is "installed" to current IFS Namespace, if not
	// install then Initialize.
	Activate: function(){
	
	    /*
		TL.Data.store = (function(){
			var origin = location.orgin || location.protocol + '//' + location.host 
			return new ifs.Capservice(origin + '/capsrv', 
					Cookie.Get('ifsuserid'), Cookie.Get('ifsuserid'), origin, {}) 
			
			
		})()
		*/
		
		
		TL.Data.store = vpt_get_capservice();
		
		store = TL.Data.store
		
		// enable localStorage caching
		TL.Data.EnableCache()
		
	    TL.Data.EnableCrypto(sessionStorage['vpt_pkey'])
	
	    TL.UI.WindowLoad()
	
		
		TL.Data.GetAppData( function(appState, appNS){
			if(!appState){
				// vaportrail application isn't installed, so install
				//TL.Data.InstallAppData({'install':TL.Data.Now(),'indices': '{}' }, 
				//function(newAppState,newAppNS){
				//	TL.Initialize(newAppState, newAppNS)
				//})
				console.log('Failed to load application state.');
			}else{	
				//console.log(appState, appNS)
				TL.Initialize(appState, appNS)
			}
		})
	
	},
	
	
	// Bootstrap the application 
	Initialize: function(state, ns){
	    
		
		function check_init_hook(){
			// inithook provides a way to restore after leaving for OAuth
			if(Cookie.Exists('inithook')){
				var inithook = Cookie.Get('inithook')
				if(inithook in TL.UI){
					TL.UI[inithook](state,ns)
					return true
				}
			}
			return false
		}
	    
		
		if( !ns.length() ){
			// no services installed, showing prompt to add services...
			$('#tl_no_services').fadeIn()
			$('#header').hide()
			flash_tooltip('#settings_icon')
			
			check_init_hook()
			return
		}
		
		
		// there are services installed, initialize their APIs
		for(var i = 0; i < ns.length(); i++){
			var srv = TL.FindSource(ns.file(i).meta()['id'])
			if(!srv){
			     continue
			}
			
			srv.initAPI($.noop)
			
			TL.SourcesInstalled[srv.id] = srv
		}
		
		check_init_hook()
		
		console.log('SourcesInstalled: ', TL.SourcesInstalled);
		
		$('#tl_no_services').hide()
		$('#tl_timeline').css('height',Math.floor(screen.height/2)+'px')
		
		//TL.UI.PopulateSourceFilters()
		
		var _now0 = new Date()
		
		TL.LoadSearchIndices()
		TL.UI.BuildTimeline()
		TL.UI.BuildAppLabels()
		TL.UI.TimelineRefresh()
		TL.UI.TimelineRefreshOverview()
		TL.UI.StreamRefresh()
		
		
		var _now1 = new Date()
		
		TL.UI.SetStatus('Core loaded in ' + ((_now1.getTime() 
				- _now0.getTime())/1000).toFixed(2) +'s')
		
		/*
		TL.LiveSyncInterval = setInterval('TL.LiveSync()', 
						TL.LiveSyncDelay)
		*/
		
	},
	
	// Handler fires when SearchApplet is loaded
	LoadSearchIndices: function(){
	
		 
		
		// Passively load or create search indices
		TL.Data.GetAppData(function(state, ns){
		
			if(!state)
				return
				
			state.indices = JSON.parse(state.indices)
			
			console.log('app.indices = ', state.indices)
			
			for(var srv in TL.SourcesInstalled){
			    console.log('LoadSearchIndices: looking for ' + srv);
				
				if(srv in state.indices){
					// load the index
					console.log('LoadSearchIndices: attempting to load ' + srv)
					search.loadIndex(srv, store, ifs.objects.Capability.fromStr(state.indices[srv]), function(ret, id){
						console.log('--->Loaded ' + id + ' search index: ' + ret)
					})
				}else{
					// create it
					var ret = search.createIndex(srv)
					console.log('Create ' + srv + ' search index: ' + ret)
				
				}
			}
		})
	},
	
	// snapshot a a live index to capserv
	SaveSearchIndex: function(srvId, cb){
		
		search.closeIndex(srvId) // can't hurt
		
		console.log('SaveSearchIndex: index closed');
		
		search.exportIndex( srvId, store, function(icap){
		    
		    console.log('SaveSearchIndex: index cap = ', icap);
		    
			TL.Data.GetAppData(function(data, ns){
				var indices = JSON.parse(data.indices || '{}')
				indices[srvId] = icap.pack()
				data.indices = JSON.stringify(indices)
				TL.Data.PutAppData(data, ns, function(){
					cb(srvId); // callback
				})
			})
		})
		
	},
	
	// Periodic sync mechanism
	LiveSync: function(){
		
		console.log("LiveSync @ " + new Date())
		//clearInterval(TL.LiveSyncInterval)
		
		var nSrvs = 0
		
		function sync_service(id, ptr){
			TL.Data.DeRefPtr(ptr, function(srv_ns){
				TL.Data.DeRefPtr(srv_ns.file(0).ptr(), function(data_blob){
					var data = JSON.parse(data_blob.val)
					var syncTime = TL.Data.Now()
					console.log("Syncing " + id + ": lastSync @ " + new Date(data['lastSync']*1000))
					TL.SourcesInstalled[id].getEventsSince(data['lastSync'], function(events){
						
						console.log(events.length + " new events.")
						//TL.SourceRawEventCache[id] = TL.SourceRawEventCache[id].concat(events)
						//TL.SourceEventCache[id] = TL.SourceEventCache[id].concat(events)
						TL.UI.TimelineAppend(events)
						TL.UI.TimelineAppendOverview(events)
						TL.UI.StreamAppend(events)
						
						data['lastSync'] = syncTime
						TL.Data.PutSourceData(srv_ns.file(0).ptr(), data, function(){
						TL.Data.PutSourceEvents(ptr, srv_ns, events, sync_service_complete)
						})
					})
				})
			})
		}
		
		function sync_service_complete(){
			if(--nSrvs == 0){
				console.log("Sync complete.")
				$('#tl_sync').fadeOut()
			}
		}
		
		
		TL.Data.GetAppData(function(data, ns){
			nSrvs = ns.length()
			if(!nSrvs){
				console.log("Sync complete (no services installed.)")
				return
			}
			
			$('#tl_sync').fadeIn()
			for(var k=0; k < ns.length(); k++){
				if(TL.IsSourceInstalled(ns.file(k).meta()['id']))
					sync_service(ns.file(k).meta()['id'], ns.file(k).ptr())
			}
		})

		
	},

	
	
	Deactivate: function(){
		return true
	},

	RegisterApp: function (appinfo) {
		"use strict";
		TL.AppsAvailable.push(appinfo);
	},

	RegisterSource: function(provider){
		TL.SourcesAvailable.push(provider)
	},
	
	IsSourceInstalled: function(srvId){
		return srvId in TL.SourcesInstalled
	},

	IsAppInstalled: function (appId) {
		return appId in TL.AppsInstalled;
	},

	FindSource: function(srvId){
		for(var k = 0; k < TL.SourcesAvailable.length; k++)
		if(TL.SourcesAvailable[k].id == srvId) return TL.SourcesAvailable[k]
		
		return null
	},
	
	Logout: function(){
	    vpt_logout({ complete: function(){
	        location.href = "/"
	    } })
	}
	
} // TL
