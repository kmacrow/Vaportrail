/**
 * The TL.UI Namespace
 * This namespace is the user interface driver/controller. 
 *
**/

function Progresser(selector, msg){
    this.selector = selector;
    this.progress = 0;
    this.msg = msg;
    this.update();
}

Progresser.prototype.setProgress = function(x){
    this.progress = (x >= 0 && x <= 100) ? x : 0;
    this.update();
}

Progresser.prototype.setMessage = function(msg){
    this.msg = msg;
    this.update();
}

Progresser.prototype.reset = function(){
    this.progress = 0;
    this.update();
}

Progresser.prototype.update = function(){
    //$(this.selector + ' .x-msg').html(this.msg);
    $(this.selector + ' .x-bar').css('width', this.progress + '%');
}




TL.UI = {

	// Handler for the browser window.onload event
	WindowLoad: function(){
	
	    // response
	    if(vpt_is_notebook())
	    	small_display();
	
	
	    $('#connected_msg').html(sessionStorage['vpt_provider_userid'] + '@' + 
	                vpt_provider_nicename(vpt_get_provider()))
	    
	    // profile badge
	    vpt_appns({complete: function(ns){
	        $('#profile_pic').attr('src', ns.meta()['profile.pic'] + '&_ts=' + new Date().getTime());
	        $('#profile_pic').attr('title', ns.meta()['profile.name']);
	        
	        // setup tooltips
	        $(document).tooltip({selector: '[rel="tooltip"]'})
	    }})
	
		// position the timeline widget
		//$('#tl_visual').css('top', (screen.availHeight/4-80)+'px')
        		
        // and the stream container
		$('#tl_pane').css('height', screen.availHeight/2 + 'px')
		$('#tl_pane').mousewheel(function(event, delta){
		    TL.UI.StreamScroll(delta == -1 ? 0 : 1)
		})
		
		if(!('__cl1' in localStorage)){
			localStorage.clear()
			localStorage['__cl1'] = 1
		}
	
		// initialize the synthetic buttons
		TL.UI._SetSyntheticButtonHandlers()
		
		// position the search suggestions popup box
		TL.UI._PositionSearchSuggest()
	
		// position the scroll bar buttons for the stream
		setTimeout('TL.UI._PositionStreamScrollbar()',500)	
	},
	
	// Handler for window.onresize
	WindowResize: function(){
		TL.UI._PositionStreamScrollbar()
		TL.UI._PositionSearchSuggest()
	},
	
	_SetSyntheticButtonHandlers: function(){
		
		// These handlers control the appearence of the synthetic
		// buttons used by the UI.
		$('.button').mousedown(function(){
			var cls = 'button-dark-click'
			if($(this).hasClass('button-light'))
				cls = 'button-light-click'
			if($(this).hasClass('button-special'))
				cls = 'button-special-click'
			$(this).addClass(cls)
		})
		$('.button').mouseup(function(){
			var cls = 'button-dark-click'
			if($(this).hasClass('button-light'))
				cls = 'button-light-click'
			if($(this).hasClass('button-special'))
				cls = 'button-special-click'
			$(this).removeClass(cls)
		})
	},
	
	_PositionSearchSuggest: function(){
		var o = $('#tl_search').offset()	
		$('#suggest_box').css({
			left: (o.left) + 'px', top: (o.top + $('#tl_search').outerHeight()) + 'px',
			width: ($('#tl_search').outerWidth() - 2) + 'px'
		})
	},
	
	_PositionStreamScrollbar: function(){
		var o = $('#tl_pane_inner').offset()
		var w = $('#tl_pane_inner').width()
		$('#tl_pane_scroll_up').css({left:(o.left+w-16)+'px',top:(o.top+2)+'px'})
		$('#tl_pane_scroll_down').css({left:(o.left+w-16)+'px',
						top:(o.top+$('#tl_pane').height()-16-2)+'px'})
	},

	// Turn automatic/periodic sync on or off
	ToggleLiveSync: function(){
		if(TL.LiveSyncInterval){
			clearInterval(TL.LiveSyncInterval)
			TL.LiveSyncInterval = null
			$('#tl_sync_switch_msg').html('Turn on LiveSync')
			$('#tl_sync_switch_icon').attr('src', 'images/sync_off.png')
		}else{
			TL.LiveSyncInterval = setInterval('TL.LiveSync()', TL.LiveSyncDelay)
			$('#tl_sync_switch_msg').html('Turn off LiveSync')
			$('#tl_sync_switch_icon').attr('src', 'images/sync_on.png')
		}
	},

	PopulateSourceFilters: function(){
		// obsolete
	},
	
	// "Delete" the data the user has backup using the app.
	DeleteUserData: function(){
		if(arguments[0] == true){
			TL.Data.PutRootPtr(null, function(){
				localStorage.clear()
				sessionStorage.clear()
				location.reload()
			})
		}else{
			TL.UI.ShowWindow('deletedata_window')
		}
	},

    AddApps: function () {
        "use strict";

        var appListHtml, k;
        appListHtml = '<table cellpadding=5 width="100%"><tbody>';

        for (k=0; k<TL.AppsAvailable.length; k++) {
	    var installed = TL.IsAppInstalled(TL.AppsAvailable[k].id);
	    var disabled = TL.AppsAvailable[k].disabled;
	    var srv_id = TL.AppsAvailable[k].id;

	    appListHtml += Template.Fill(
		'<tr><td width="16">&nbsp;</td><td align="center">'+
		    '<img src="${logo}" style="height:32px" /></td><td style="${solStyle}"><p>${solicitation}</p></td><td align="center" style="width:100px"><button class="btn ${btnClass}" id="addremove_button_${id}" onclick="${onclick}">${btnLabel}</button></td><td width="16"><img id="addremove_spinner_${id}" src="images/timeline-spinner.gif" style="display:none" /></td></tr><tr><td></td><td colspan="3" style="border-bottom: ${borderBottomPx}px solid #ccc"></td></tr>', 

                //Can't add/remove the built-in app (timeline) for now...
		TL.AppsAvailable[k],
		{
		    'btnDisabledAttr': (TL.AppsAvailable[k].disabled?'disabled="disabled" class="btn disabled"':''),
		    'btnLabel':	'Built-in', // (installed?'Remove':'Install'),
		    'btnClass': 'disabled', // disabled ? 'disabled' : (installed?'btn-danger':'btn-primary'),
		    'borderBottomPx': (k!=TL.AppsAvailable.length-1?1:0),
		    'solStyle': disabled ? 'color:#777;font-style:italic' : '',
		    'onclick': '' // disabled ? '' : "TL.UI.AddRemoveSource('"+srv_id+"')"
                });
	} // for

	appListHtml += '</tbody></table>';

	$('#settings_apps').html(appListHtml);
    },

    // Show a dialog for the user to add and remove data sources
    AddSources: function(){

	var srvListHtml = '<table cellpadding=5 width="100%"><tbody>'

	for(var k=0;k<TL.SourcesAvailable.length;k++){
	    var installed = TL.IsSourceInstalled(TL.SourcesAvailable[k].id)
	    var disabled = TL.SourcesAvailable[k].disabled
	    var srv_id = TL.SourcesAvailable[k].id

	    srvListHtml += Template.Fill(
		'<tr><td width="16">&nbsp;</td><td align="center">'+
		    '<img src="${logo}" style="height:32px" /></td><td style="${solStyle}"><p>${solicitation}</p></td><td align="center" style="width:100px"><button class="btn ${btnClass}" id="addremove_button_${id}" onclick="${onclick}">${btnLabel}</button></td><td width="16"><img id="addremove_spinner_${id}" src="images/timeline-spinner.gif" style="display:none" /></td></tr><tr><td></td><td colspan="3" style="border-bottom: ${borderBottomPx}px solid #ccc"></td></tr>', 

		TL.SourcesAvailable[k],
		{
		    'btnDisabledAttr': (TL.SourcesAvailable[k].disabled?'disabled="disabled" class="btn disabled"':''),
		    'btnLabel':	(installed?'Remove':'Install'),
		    'btnClass': disabled ? 'disabled' : (installed?'btn-danger':'btn-primary'),	
		    'borderBottomPx': (k!=TL.SourcesAvailable.length-1?1:0),
		    'solStyle': disabled ? 'color:#777;font-style:italic' : '',
		    'onclick': disabled ? '' : "TL.UI.AddRemoveSource('"+srv_id+"')" });
	} // for

	srvListHtml += '</tbody></table>';

	$('#settings_sources').html(srvListHtml)
	
    }, // AddSources
	
    AddModules: function() {
        TL.UI.AddSources();
	TL.UI.AddApps();
    },

	// When the add/remove modules dialog is closed, this is called to initialize
	// the import of new data sources.
	AddModulesClose: function(){

		$('#settings_modal').modal('hide')
		Cookie.Erase('inithook')
		Cookie.Erase('addQ')
		
		// no services to import
		if(!TL.AddSourcesQueue.length){
			//TL.UI.PopulateSourceFilters()
			if(Object.keys(TL.SourcesInstalled).length){
				//TL.UI.BuildTimeline(TL.SourceEventCache)
				TL.UI.BuildAppLabels()
				TL.UI.TimelineRefresh(true)
				TL.UI.StreamRefresh()
				TL.UI.TimelineRefreshOverview()
			}else{
				$('#tl_search_container,#tl_visual').hide()
				$('#tl_pane_scroll_up,#tl_pane_scroll_down').hide()
				$('#tl_app_label').hide()
				$('#header').hide()
				$('#tl_no_services').show()
				$('.icon-tag').remove()
			}
			return
		}
		
		// import
		function import_service(id,ptr,ns){
			// download
			var niceName = TL.SourcesInstalled[id].niceName;
			
			// notification area
			$('#importservice_logo').attr('src', TL.SourcesInstalled[id].icon);
			$('#importservice_title').html('Importing ' + niceName);
			
			// widget to track progress in the UI
			var progress = new Progresser('#importservice_progress',
			                        'Importing ' + niceName);
			                        
			progress.setProgress(20);
			
			console.log("Importing " + id)
			
			TL.SourcesInstalled[id].getEvents(function(events){
				console.log("Got " + events.length + " events.")
				
				progress.setProgress(50);
				//progress.setMessage('Storing ' + events.length + ' ' + niceName + ' objects...');
				
				// upload
				TL.UI.TimelineAppendOverview(events)
				
				TL.Data.PutSourceEvents(ptr, ns, events, function(ns, ns_cap, event_caps){
					console.log(id + " events stored in IFS.")
					
					progress.setProgress(80);
					//progress.setMessage('Indexing ' + niceName + ' objects...');
					
					//TL.UI.UpdateSearchIndex(id, ns_cap.pack(), 'rebuild', 1)
					TL.UI.IndexEvents(id, events, event_caps, progress)
					
					progress.setProgress(100);
					//progress.setMessage('Complete...');
					
					import_service_complete(id)
				}, progress)
			})
										
		}
		
		function import_service_complete(id){
			console.log("Import " + id + " complete")
			if(!TL.AddSourcesQueue.length){
				TL.LiveSyncInterval = setInterval('TL.LiveSync()',TL.LiveSyncDelay)
				$('#importservice_window').fadeOut();
			}else{
				var nextSrv = TL.AddSourcesQueue.shift()
				import_service(nextSrv.id,nextSrv.ptr,nextSrv.ns)
			}
			
			// rebuild the UI anyway
			TL.UI.BuildAppLabels()
		    TL.UI.TimelineRefresh()
			TL.UI.StreamRefresh()
		}
		
		// suspend sync while import in progress
		clearInterval(TL.LiveSyncInterval)
		///
		
		// check if the timeline widget needs to be built
		if(TL.AddSourcesQueue.length == Object.keys(TL.SourcesInstalled).length)
		TL.UI.BuildTimeline()
		
		// add the timeline bands upfront
		for(var i = 0; i < TL.AddSourcesQueue.length; i++){
			TL.UI.AddTimelineBand(TL.AddSourcesQueue[i].id)
		}
		
		// build the service chicklets at appear in the top left of bands
		TL.UI.BuildAppLabels()
	
		var srv = TL.AddSourcesQueue.shift()
		
        $('#importservice_window').fadeIn() 
			
		import_service(srv.id, srv.ptr, srv.ns)
			
		
	},
	
	// Add or remove a service from the app registry stored in IFS
	AddRemoveSource: function(id){
		
		console.log("Add-Remove Source: " + id)
		Cookie.Erase('inithook')
		Cookie.Erase('addQ')
		
		// The service is already installed, so remove it
		if(TL.IsSourceInstalled(id)){
			
			$('#addremove_spinner_'+id).show()
			//document.getElementById('addremove_button_'+id).disabled=true
			
			TL.Data.DelSource(id, function(){
				console.log("Source Removed: " + id)
				delete TL.SourcesInstalled[id]
				TL.UI.RemoveTimelineBand(id)
				TL.UI.BuildAppLabels()
				//delete TL.SourceEventCache[id]
				$('#addremove_button_'+id).html('Install')
				$('#addremove_button_'+id).removeClass('btn-danger').addClass('btn-primary')
				
				$('#addremove_spinner_'+id).hide()
				
				for(var i = 0; i < TL.AddSourcesQueue.length; i++){
					if(TL.AddSourcesQueue[i].id == id){
						TL.AddSourcesQueue.remove(i)
						break;
					}
				}	
				//TODO document.getElementById('addremove_button_'+id).disabled=false
			})
		
		//
		// Otherwise the service isn't installed, so add it.	
		//
		}else{
		
			$('#addremove_spinner_'+id).show()
			//TODO document.getElementById('addremove_button_'+id).disabled=true
		
			TL.Data.AddSource(id, {'install':TL.Data.Now(),'lastSync':TL.Data.Now()}, function(sid,data,ptr,ns){
				console.log("Source Added: " + sid)

				TL.AddSourcesQueue.push({'id':sid,'ptr':ptr,'ns':ns})
				
				TL.SourcesInstalled[id] = TL.FindSource(id)
	
				TL.SourcesInstalled[id].initAPI(function(){
				
					TL.SourcesInstalled[id].isLoggedIn(function(result){
						$('#addremove_spinner_'+id).hide()
						//TODO document.getElementById('addremove_button_'+id).disabled=false
					
						if(!result){
						
							// These cookies let the UI restore itself if the authentication 
							// for the service being installed requires a redirect to
							// another website. 
							Cookie.Set('inithook','RestoreAddSource')
							Cookie.Set('addQ',JSON.stringify(Array.pick(TL.AddSourcesQueue,'id')))
						
							$('#addremove_button_'+id).html("Login")
							document.getElementById('addremove_button_'+id).onclick = 
									eval('(function(){TL.SourcesInstalled["'+id+'"].login(TL.UI.AuthComplete)})')
						
							$.each(Array.pick(TL.SourcesAvailable, 'id'), function(i, sid){
								if(sid != id){
									var btn = document.getElementById('addremove_button_'+sid)
									// TODO btn.disabled = true
									// TODO btn.className = 'disabled'
								}
							})
							
						}else{
							$('#addremove_button_'+id).html('Remove')
							$('#addremove_button_'+id).removeClass('btn-primary').addClass('btn-danger')
						}
					})
				
				})//initAPI
				
			})//AddSource
		
		}
	}, // AddRemoveSource
	
	
	// This is called when the auth window for a service is closed.
	AuthComplete: function(srvId, result){
	
		Cookie.Erase('inithook')
		Cookie.Erase('addQ')
		$('#addremove_button_'+srvId).html('Remove')
		$('#addremove_button_'+srvId).removeClass('btn-primary').addClass('btn-danger')
		
		// shoot me in the face:
		document.getElementById('addremove_button_'+srvId).onclick = 
			eval('(function(){TL.UI.AddRemoveSource("'+srvId+'")})')
		
		$.each(Array.pick(TL.SourcesAvailable, 'id'), function(i, sid){
			if(sid != srvId){
				var btn = document.getElementById('addremove_button_'+sid)
				//TODO btn.disabled = false
				//TODO btn.className = ''
			}
		})
	},
	
	// This "inithook" is called if the auth for a service required
	// redirect to another website. It restores the queue of services to
	// be backed up and shows the appropriate dialog.
	RestoreAddSource: function(appState, appNS){
		
		// show the add/remove services window
		TL.UI.AddSources()
		
		TL.AddSourcesQueue = []
		
		function queue_service(id, ptr){
			TL.Data.DeRefPtr(ptr, function(srv_ns){
				TL.AddSourcesQueue.push({'id':id,'ptr':ptr,'ns':srv_ns})
				//TL.UI.AddTimelineBand(id)
			})
		}
		
		// restore the AddSourceQueue
		// TODO: There should be a guard here for making sure 
		// the queue is fully restored before opening the UI
		var addQ = JSON.parse(Cookie.Get('addQ'))
		
		$.each(addQ, function(i, id){
			$.each(appNS.files(), function(k, file){
				if(file.meta()['id'] == id){
					queue_service(id, file.ptr())
					return false
				}
			})
		})
		
	},
	
	// TimelineRefresh([bool clear]) 
	// Does a fuzzy search for events near where the timeline is currently
	// centred and loads them for display.
	TimelineRefresh: function(){
		
		var tl = Timeline.getTimelineFromID(0)
		var b0 = tl.getBand(0) 
		
		// is the timeline being dragged?
		if(b0._dragging) return
		
		console.log("Refreshing timeline...")
		
		var centre = b0.getCenterVisibleDate()
		
		console.log("Time centered at: " + centre)
		
		function events_loaded(events){
			
			for(var j=0; j < events.length; j++){
				if( events[j].hash in TL.EventHashTable )
					events.remove(j--)
				else
					TL.EventHashTable[events[j].hash]=1
			}
			if(events.length)
				TL.UI.GetTimelineBandByID(events[0].type).getEventSource().loadJSON({'events':events},'.') // add events to timeline
			
		}
		
		// optionally clear the event stream before refresh
		if(arguments[0] && arguments[0] == true){
			for(var srv in TL.SourcesInstalled)
				TL.UI.GetTimelineBandByID(srv).getEventSource().clear()
				
			TL.EventHashTable = {}
		}
		
		TL.Data.GetAppData( function(data, ns){
		    
			for(var k = 0; k < ns.length(); k++){
			    //console.log('SERVICE: ', ns.file(k).ptr())
			    
			    /*
			    store.getptr(ns.file(k).ptr(), {onResponse: function(resp){
			        //console.log('getptr: ', resp);
			        store.getfilelist(resp.data, {onResponse: function(resp){
			            //console.log('...which is: ', resp);
			        }})
			    }})
			    */
			    
			    
				TL.Data.DeRefPtr(ns.file(k).ptr(), function(srv_ns){
				    if(srv_ns == null){
				        console.log('Source Namespace is NULL.')
				        return;
				    }
					TL.UI.GetEventsCentredAt(srv_ns, Math.floor(centre.getTime()/1000), events_loaded)
				})
			}
		})
		
		
	},
	
	// TimelineRefreshOverview()
	// Reloads the year and month band event overviews.
	TimelineRefreshOverview: function(){
	
		var numSrvs
		var overviewEvents = []
			
		function services_loaded(){
		
			var tl = Timeline.getTimelineFromID(0)
			var es1 = TL.UI.GetTimelineMonthBand().getEventSource()
			var es2 = TL.UI.GetTimelineYearBand().getEventSource()
			
			es1.clear()
			es2.clear()
			es1.loadJSON({'events':overviewEvents},'.')
			es2.loadJSON({'events':overviewEvents},'.')
			
		}
		
		function service_load_complete(srv_ns){
		
			for(var j=1;j<srv_ns.length();j++){
				
				if(!srv_ns.file(j).meta()['rule']){
				
					// regular event
					var event = {start: new Date(srv_ns.file(j).meta()['start']*1000)}
					if(srv_ns.file(j).meta()['end'] > 0){
						event.end = new Date(srv_ns.file(j).meta()['end']*1000)
						event.durationEvent = true
					}
					if(srv_ns.file(j).meta()['color']){
						event.color = srv_ns.file(j).meta()['color']
					} 
					overviewEvents.push(event)
				
				}else{
					// recurring event		
					overviewEvents = overviewEvents.concat(TL.UI.GenRecurOvEvents(srv_ns.file(j)))
					
				}
					
					
			}// for
			
			if(--numSrvs == 0) services_loaded()
		}
		
		TL.Data.GetAppData(function(data, ns){
			numSrvs = ns.length()
			if(!numSrvs)
			return services_loaded()
			
			for(var k=0;k < ns.length();k++){
				TL.Data.DeRefPtr(ns.file(k).ptr(), service_load_complete)
			}
		})
	},
	
	/* GenRecurOvEvents()
	 Nobody's favourite function. This beast generates "overview" events
	 for a given recurring event based on its recurrence rule. An overview
	 event only contains enough information to serve as a tick on the
	 month and year bands, it doesn't contain titles, descriptions, icons, etc.,
	 found in full events. */
	GenRecurOvEvents: function(e){
		
		var events = []
		
		if(typeof e.meta == 'function'){
			// it's a CapList entry
			var rule = JSON.parse(e.meta()['rule'])
			var estart = e.meta()['start']
			var eend = e.meta()['end']
			var ecolor = e.meta()['color'] ? e.meta()['color'] : '#21D6FF'
		}else{
			// it's an event object
			var rule = e.rule
			var estart = Math.floor(e.start.getTime()/1000)
			var eend = e.end ? Math.floor(e.end.getTime()/1000) : 0
			var ecolor = e.color ? e.color : '#21D6FF'
		}
		
		if(rule['freq'] == 'monthly'){
			
			var tstart = new Date(estart*1000)
			var tend = new Date(eend ? eend*1000 : new Date().getTime()+60*60*24*365*1000)
			var yr = tstart.getFullYear()
			var mo = tstart.getMonth()
			var dy = rule['daynum'] - 1
			var time = rule['time']
			
			var curstart = new Date(new Date(yr,mo,dy,0,0,0,0).getTime() + time*1000)
			var hh = curstart.getHours()
			var mm = curstart.getMinutes()
			var ss = curstart.getSeconds()
			
			while(curstart <= tend){
			
				var event = {	start: curstart, 
						end: new Date(curstart.getTime() + rule['duration']*1000),
						durationEvent:true,
						color: ecolor	}
				
				// preserve the entry
				if(typeof e.meta == 'function'){
					event.meta = $.extend({},e.meta())
					event.meta['start'] = Math.floor(curstart.getTime()/1000)
					event.ptr = e.ptr()
				}
				
				events.push($.extend({},event))
				
				/// TODO: When to roll the year number?
				if( (mo + rule['interval']) % 12 <= mo)
					yr++
					
				mo = (mo + rule['interval']) % 12
				curstart = new Date(yr,mo,dy,hh,mm,ss,0)
				
				
			}
			
		}else if(rule['freq'] == 'weekly'){
			
			var tstart = TL.Recurrence.GetStartOfWeek(new Date(estart*1000))
			var tend = eend ? eend*1000 : new Date().getTime()+60*60*24*365*1000
			
			//console.log(new Date(tstart) + ' ' + new Date(tend) + ' ' + srv_ns.files[j].meta['start'] + ' ' + srv_ns.files[j].meta['end'])
			
			while(tstart < tend){
				for(var m=0; m < rule['days'].length; m++){
					var dayStart = tstart + rule['days'][m]*TL.Recurrence.msPerDay
					
					var evtStart = new Date(dayStart + rule['time']*1000)
					
					var event = {	start: evtStart, 
						     	end: new Date(dayStart + rule['time']*1000 + rule['duration']*1000),
						     	durationEvent: true,
						     	color: ecolor	}
					
					// preserve the entry
					if(typeof e.meta == 'function'){
						event.meta = $.extend({},e.meta())
						event.meta['start'] = Math.floor(evtStart.getTime()/1000)
						event.ptr = e.ptr()
					}
					
					events.push($.extend({},event))
				
				}
				tstart += TL.Recurrence.msPerWeek * rule['interval']
				
				
			}
			
		}
		
		
		return events
	
	},
	
	// _TimelineAppendClean()
	// Filter a list of events to remove those that are already on the
	// timeline before adding them. 
	_TimelineAppendClean: function(events, expandRecur){
		var cleaned = []
		for(var i=0;i<events.length;i++){
			if(!events[i].hash)
				events[i].hash = TL.Data.HashEvent(events[i])
			if(events[i].hash in TL.EventHashTable)
				continue
			if(events[i].rule){
				if(expandRecur){	
					cleaned = cleaned.concat(TL.UI.GenRecurOvEvents(events[i]))
				}else{
					continue	
				}
			}else{
				cleaned.push(events[i])
			}
		}
		return cleaned
	},
	
	// TimelineAppend()
	// Append a homogeneous list of events to the timeline. Which service band they are
	// added to is determined from the 'type' attribute of the first event.
	TimelineAppend: function(events){
		if(!events.length) return
		var es = TL.UI.GetTimelineBandByID(events[0].type).getEventSource()
		es.loadJSON({'events': TL.UI._TimelineAppendClean(events, false)},'.')
	},
	
	// Same as TimelineAppend but for the overview bands
	TimelineAppendOverview: function(events){
		var es1 = TL.UI.GetTimelineMonthBand().getEventSource()
		var es2 = TL.UI.GetTimelineYearBand().getEventSource()
		var clean = TL.UI._TimelineAppendClean(events, true)
		es1.loadJSON({'events':clean},'.')
		es2.loadJSON({'events':clean},'.')
	},
	
	// StreamAppend()
	// Adds one or more entries to the stream UI with an animation
	StreamAppend: function(events){
		
		if(!events.length)
		return
		
		var events = events.sort(function(e1,e2){
			return e2.start.getTime() - e1.start.getTime()
		})
		
		var plug = '<div id="bulk_entry_'+events[0].hash+'" style="display:none">'
		
		for(var i = 0; i < events.length; i++){
			plug += TL.UI._StreamEntry(events[i], true) 
		}
		
		plug += '</div>'
		
		$(plug).prependTo('#tl_pane_scroll')
		// scroll stream to top and slide new entries down
		$('#tl_pane_scroll').animate({'top':'0px'},500,function(){
			$('#bulk_entry_'+events[0].hash).slideDown()
			TL.UI.StreamScrollCheck()
		})
	},
	
	// StreamScroll()
	// Custom scrolling behavior for the stream UI
	StreamScroll: function(updown){
		var cur = parseInt($('#tl_pane_scroll').css('top'))
		
		if(updown){
			// scroll up
			cur += 200
			if(cur > 0)
			cur = 0;
		}else{
			// scroll down
			if(Math.abs(cur) < $('#tl_pane_scroll').height() - $('#tl_pane_inner').height()){ 
				cur -= 200
			}else{
				// load some more events
				cur -= 200
				$('#tl_pane_scroll').animate({'top': cur + 'px'})
				
				//nasty
				if($('#tl_search').val().trim()=='')
					TL.UI.StreamRefresh(true)
				return
			}
				
		}
		$('#tl_pane_scroll').animate({'top': cur + 'px'})
		
	},
	
	// StremScrollCheck()
	// Determine whether to show or hide the scroll buttons based on 
	// whether the stream contents can be scrolled.
	StreamScrollCheck: function(){
		
		var h0 = $('#tl_pane_inner').height()
		var h1 = $('#tl_pane_scroll').height()
		//console.log(h0, h1)
		if(h1 > h0){
			$('#tl_pane_scroll_up').show()
			$('#tl_pane_scroll_down').show()
		}else{
			$('#tl_pane_scroll_up').hide()
			$('#tl_pane_scroll_down').hide()
		}
	},
	
	// StreamSeekTime()
	// Move the timeline to centre on a unix timestamp time
	StreamSeekTime: function(time, type, hash){
		
		if(!hash) return
		
		
		var date = new Date(time)
		var refband = Timeline.getTimelineFromID(0).getBand(0)
		
		function doHighlight(){
			TL.UI.StreamHighlightEvent(type, hash)
			var band = TL.UI.GetTimelineBandByID(type)
			band._eventPainter.showBubble(
				band._eventSource.getEvent(hash)
			)
		}
		
		if(refband.getCenterVisibleDate().getTime() != date.getTime()){
			refband.setCenterVisibleDate(date)
			setTimeout(doHighlight, 300)
		}else{
			doHighlight()
		}
	},
	
	StreamHighlightEvent: function(type, hash){
		
		function createCircle(x,y){
			var C = document.createElement("div")
			C.className = "timeline-x-circle"
			C.style.width = '32px'
			C.style.height = '32px'
			C.style.left = (x - 8 - 1) + 'px'
			C.style.top = (y - 8 - 1) + 'px'
			return C
		}
		
		$('.timeline-x-circle').remove()
		
		var e = TL.UI.GetTimelineEventElem(type, hash)
		if(!e) return
		
		var pos = $(e).position()
		
		var c = createCircle(pos.left, pos.top)
	
		$(e).parent().append(c)
		
	
	},
	
	// StreamRefresh()
	// Builds the stream contents by selecting top N events from your
	// recent data.
	StreamRefresh: function(){
		
		var event_heads = []
		var top_event_heads = []
		var num_srvs = 0
		//var stream_html = ''
		
		function stream_empty(){
			// do nothing
		}
		
		function service_loaded(srv_ns){
			
			if(!srv_ns) 
			return
			
			for(var k = 1; k < srv_ns.length(); k++){
				var e = srv_ns.file(k)
				if(e.meta()['rule']){
					// expand recurrence rule
					var now = Math.floor(new Date().getTime()/1000)
					var tmp_event_heads = TL.UI.GenRecurOvEvents(e)
					
					// ugly: remove future events
					for(var m=0; m < tmp_event_heads.length; m++){
						if(tmp_event_heads[m].meta['start'] >= now){
						   //console.log(new Date(tmp_event_heads[m].meta['start']*1000))
						   continue
						}
						event_heads.push(tmp_event_heads[m])
					}
					
						
				}else{
					var e_flat = {}
					e_flat.meta = $.extend({}, e.meta())
					e_flat.ptr = ifs.objects.Capability.fromStr(e.ptr().pack())
					event_heads.push(e_flat)
				}
			}			
						
			if(--num_srvs == 0)
			return event_heads_loaded()
		}
		
		
		function event_heads_loaded(){
			// now we have a header for ALL the events
			// still need to expand recurrences
			
			// sort by start time
			event_heads = event_heads.sort(function(e1,e2){
				return e2.meta['start'] - e1.meta['start']
			})
			
			var range_start = TL.StreamPage * 15
			var range_end = range_start + 15
			
			if(event_heads.length > range_start)
				top_event_heads = event_heads.slice(range_start, range_end)
			else 
				top_event_heads = []
			
			//console.log('EVENTHEADS: ', top_event_heads)
			
			if(top_event_heads.length){
				return chain_load_event( top_event_heads.shift() )
			}else{
				return stream_empty()
			}	
		}
		
		function chain_load_event(head){
			store.getfile(head.ptr, {onResponse: function(blob){
				if(!blob)
				return
				
				var event = JSON.parse(blob.data.val)
				if(event.rule){
					event.start = head.start
					if(head.end)
						event.end = head.end
					else
						event.end = 0
				}else{
					event.start = new Date(event.start)
					if(event.end)
						event.end = new Date(event.end)
				}
				
				document.getElementById('tl_pane_scroll').innerHTML += TL.UI._StreamEntry(event)
				
				// the chain part
				if(top_event_heads.length){
					chain_load_event(top_event_heads.shift())
				}else{
					stream_refresh_complete()
				}
			}})
		}
		
		function stream_refresh_complete(){
			TL.UI.StreamScrollCheck()
		}
		
		if(!arguments[0]){
			document.getElementById('tl_pane_scroll').innerHTML = ''
			$('#tl_pane_scroll').css('top','0px')
			TL.StreamPage = 0
		}else{
			TL.StreamPage++
		}
		
		TL.Data.GetAppData(function(data, ns){
			num_srvs = ns.length()
			if(!num_srvs)
			return stream_empty()
			
			for(var i=0;i<ns.length();i++){
				TL.Data.DeRefPtr(ns.file(i).ptr(), service_loaded)
			}
		})
	}, // StreamRefresh
	
	// _StreamEntry()
	// Generate the markup for an event to be displayed in the stream UI
	_StreamEntry: function(event){
		
		var datetime = ''
		var days = ['Sun','Mon','Tues','Wed','Thu','Fri','Sat']
		var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
						
		function to_time(date){
			var mins = date.getMinutes()
			var hrs = date.getHours()
			return (hrs == 0 ? '00' : hrs) + ':' + (mins == 0 ? '00' : (mins < 10 ? '0'+mins : mins) )
		}
		
		function to_day(date){
			var today = new Date()
			if(date.getDate() == today.getDate()
				&& date.getFullYear() == today.getFullYear()
					&& date.getMonth() == today.getMonth()){
				return 'Today'
			}else{
				return days[date.getDay()] + ', ' + months[date.getMonth()] + ' ' + date.getDate()
			}
		}
		
		function time_offset(off){
			var d = new Date()
			var t = d.getTime()-(d.getHours()*60*60*1000+d.getMinutes()*60*1000+d.getSeconds()*1000+d.getMilliseconds())
			return new Date(t + off*1000 + d.getTimezoneOffset()*60*1000)
		}
		
		function trunc_50(str){
			if(str.length <= 50)
			return str
			return str.substring(0, 50) + '...'
		}
		
		if(event.rule){
			var rule = event.rule
			//console.log('RULE ', rule) 
			datetime = 'Every '
			if(rule.interval && rule.interval > 1)
				datetime += rule.interval
				
			if(rule['freq'] == 'monthly'){
				if(rule.interval && rule.interval > 1)
					datetime += ' months'
				else
					datetime = 'Monthly'
					
				datetime += ' on the ' + rule.daynum
				
			}else if(rule['freq'] == 'weekly'){
				if(rule.interval && rule.interval > 1)
					datetime += ' weeks'
				else
					datetime = 'Weekly'
				
				datetime += ' ' + $.map(rule.days, function(di){return days[di]}).join(', ')
			}
			
			if(rule.time && rule.duration){
				datetime += ' from ' + to_time(time_offset(rule.time)) + ' - ' + to_time(time_offset(rule.time+rule.duration))
			}else{
				datetime += ' at ' + to_time(time_offset(rule.time)) 
			}
			
		
		}else{
			if(event.start && event.end){
				datetime = to_time(event.start) + ' - ' + to_time(event.end) + ' ' + to_day(event.start)
			}else{
				datetime = 'at ' + to_time(event.start) + ' ' + to_day(event.start) 
			}
		}
		
		var params = {
			'datetime': datetime,
			'entry_id': 'entry_'+event.hash,
			'icon': event.appIcon,
			'type': event.type,
			'start_ms': event.start.getTime(),
			'title': event.title ? event.title : (event.caption ? event.caption : 'Untitled event'),
			'hash': event.hash ? event.hash : "",
			'description': event.stream ? event.stream : trunc_50(event.description)
		}
		
		return Template.Fill('<div class="pane-entry'+(arguments[1] && arguments[1]==true?' pane-entry-new':'')+'" id="${entry_id}"> \
					<table width="100%" onmouseover="TL.UI.StreamHighlightEvent(\'${type}\',\'${hash}\')" onmouseout="TL.UI.StreamHighlightEvent(\'\',\'\')"> \
						<tr><td rowspan="3" valign="top" width="26"><img src="${icon}" class="pane-entry-icon" /></td> \
						    <td><b><span style="cursor:pointer" onclick="TL.UI.StreamSeekTime(${start_ms},\'${type}\',\'${hash}\')">${title}</span></b></td></tr> \
						<tr> \
						    <td>${description}</td></tr> \
						<tr><td><small>${datetime}</small></td></tr> \
					</table> \
				      </div>', params)
	},
	
	// Set the app status
	SetStatus: function(str){
		$('#tl_status').html(str)
	},
	
	// Handle key press events on the search input box
	SearchKeyPress: function(){
		
		
		switch(event.keyCode){
			case 13:
				// [enter]
				clearTimeout(TL.UI.LiveSearchTimeout)
				TL.UI.SearchTrigger()
			break;
			case 38:
				// [up]
				TL.UI.SearchSuggestScroll(1)
				//TL.UI.SearchTrigger()
			break;
			case 40:
				// [down]
				TL.UI.SearchSuggestScroll(0)
				//TL.UI.SearchTrigger()
			break;
			default:
				clearTimeout(TL.UI.LiveSearchTimeout)
				TL.UI.LiveSearchTimeout = setTimeout('TL.UI.SearchTrigger()',100)
				
		}
	
	},
	
	// Selection model for the search suggestions box
	SearchSuggestScroll: function(updown){
		var selectedIndex = $('#suggest_box').data('selectedIndex')
		var numChildren = $('#suggest_box').children().length
		
		$('#suggest_box').children().removeClass('selected')
		
		if(updown){
			if(selectedIndex > 0)
			selectedIndex = (selectedIndex - 1) % numChildren		
		}else{
			selectedIndex = (selectedIndex + 1) % numChildren
		}
		
			 
		if(selectedIndex >= 0){
			$($('#suggest_box').children()[selectedIndex]).addClass('selected')
			$('#tl_search').val($($('#suggest_box').children()[selectedIndex]).html())
		}
		
		$('#suggest_box').data('selectedIndex', selectedIndex)
	},
	
	SearchFocusBlur: function(){
		$('#suggest_box').fadeOut()
	},
	
	// Fire a query off to the search service
	SearchTrigger: function(){
		var q = $('#tl_search').val().trim()
		
		if(q == ''){
			//TL.UI.SearchDisplayResult({numhits:0,results:[],suggest:[]})
			TL.UI.SearchRevertToStream()
			return
		}
		
		if(q.indexOf(' ') != -1)
			q = '"' + q + '"' // phrase query
		else
			q += '*'	  // wildcard
		
		TL.UI.QueryMergedIndices(Object.keys(TL.SourcesInstalled), q, function(result){
			TL.UI.SearchDisplayResult(result)	
		})
	},
	
	// Display search results in the stream UI panel
	SearchDisplayResult: function(result){
		
		//$('#stream_link').show()
		
		$('#suggest_box').html('')
		$('#tl_pane_scroll').html('')
		TL.UI.SearchRemoveOverviewMarks()
		TL.UI._PositionSearchSuggest()
		
		TL.StreamPage = 0
		
		$('#suggest_box').data('selectedIndex', -1)
		for(var i=0; i < result.suggest.length; i++){
			$('#suggest_box').append('<div onclick="$(\'#tl_search\').val($(this).html());TL.UI.SearchTrigger()">'+result.suggest[i]+'</div>')
		}
		
		if(result.suggest.length)
			$('#suggest_box').show()
		else
			$('#suggest_box').hide()
		
		if(!result.results.length){
			$('#tl_pane_scroll').html('<div class="pane-message">No results found.</div>')
			TL.UI.StreamScrollCheck()
			return
		}
			
		function result_loaded(blob){
			var event = JSON.parse(blob.data.val)
			event.start = new Date(Date.parse(event.start))
			if(event.end)
				event.end = new Date(Date.parse(event.end))
			
			if(!event.rule)
				TL.UI.SearchAddOverviewMark(event.start)
			
			$('#tl_pane_scroll').append( TL.UI._StreamEntry(event) )
			TL.UI.StreamScrollCheck()
		}	
		
		
		for(var i=0; i < result.results.length; i++){
			store.getfile( ifs.objects.Capability.fromStr(result.results[i]._cap_), 
			{onResponse: result_loaded})
		}
		
		
	},
	
	// Clear search results switch back to stream view
	SearchRevertToStream: function(){
	
		//$('#stream_link').hide()
		TL.UI.SearchRemoveOverviewMarks()
		TL.UI.StreamRefresh()
	},
	
	
	// Index events using the client side plugin
	IndexEvents: function(indexId, events, event_caps, progress){
		
		console.log('Indexing ' + events.length + ' events for ' + indexId)
		
		
		if(!search.openIndex(indexId, false)){
			search.createIndex(indexId)
			search.openIndex(indexId, true)
			console.log('Created index for ' + indexId)
			
		}
		
		for(var i = 0; i < events.length; i++){
		
		    // cap might have been dropped on
		    // upload
		    if(!event_caps[i]){
		        continue;
		    }
		
			var doc = {
				stored:		{'_cap_': event_caps[i].pack()},
				indexed:	{'description': events[i].description},
				interned: 	{}
			}
			
			//console.log(doc)
			
			var ret = search.addDocument(indexId, doc)
		
			if(!ret) console.log('Indexing failed.')
			
			progress.setProgress( (i + 1) / events.length );
		}
		
		search.closeIndex(indexId) // shut the door 
		
		// snapshot the index
		TL.SaveSearchIndex(indexId, function(){
			console.log('Done.')
		})
	
	
	},
	
	// Build or update an index using the indexing/search service
	// XXX Deprecated (in favor of IndexEvents)
	UpdateSearchIndex: function(indexId, listCapStr, mode, offset){
		TL.UI.SetStatus('Indexing your data for search...')
		
		$.ajax({
			url: store.__gwt_instance.inner.storeUrl + '/treadstone/index', // using capservice url
			type: 'POST',
			data: {'root': listCapStr,'mode': mode, 'offset': offset, 'index': indexId},
			dataType: 'json',
			success: function(result){
				TL.UI.SetStatus('')
				console.log('Indexing Complete: ', result) 
			},
			error: function(){
				TL.UI.SetStatus('')
				console.log('Indexing failed.')
			}
		})	
		
	},
	
	// Add a mark to the overview bands for a search hit
	SearchAddOverviewMark: function(at){
		var yr = TL.UI.GetTimelineYearBand()
		var mo = TL.UI.GetTimelineMonthBand()
		
		function marker(offset){
			var layer = document.createElement('div')
			layer.className = 'timeline-x-marker'
			layer.style.left = offset + 'px'
			return layer
		}
		
		yr._etherPainter._backgroundLayer.appendChild(
			marker( yr.dateToPixelOffset(at) ))
		mo._etherPainter._backgroundLayer.appendChild(
			marker( mo.dateToPixelOffset(at) ))
		
	},
	
	// Clear all the overview marks
	SearchRemoveOverviewMarks: function(){
		$('.timeline-x-marker').remove()
	},
	
	// Execute a search query across a set of indices,
	// return merged results.
	QueryMergedIndices: function(indices, query, callback){
		
		var merged_results = {
			'latency': 0,
			'numhits': 0,
			'results': [],
			'suggest': [],
			'status': true
		}
		
		var num_indices = indices.length
		
		if(!num_indices)
			return callback(merged_results)
		
		function results_loaded(result){
			//merged_results.latency += result.latency
			merged_results.numhits += result.results.length
			merged_results.results = merged_results.results.concat(result.results)
			merged_results.suggest = merged_results.suggest.concat(result.suggest.slice(0, Math.floor(10/indices.length)))
					
			if(--num_indices == 0){
				//console.log('Search Results: ', merged_results)
				merged_results.suggest = merged_results.suggest.unique()
				callback(merged_results)
			}
		}
		
		for(var i=0; i < indices.length; i++){
			/*
			$.ajax({
				url: store.__gwt_instance.inner.storeUrl + '/treadstone/search',
				type: 'GET',
				data: {'q': query, 'index': indices[i]},
				dataType: 'json',
				success: results_loaded,
				error: function(){
					console.log('Search failed.')
				}	
			})
			*/
			var res = search.search(indices[i], 'description', query)
			
			// transform an object with integer keys into a native array
			res.results = Object.objectArray(res.results)
			res.suggest = Object.objectArray(res.suggest)
			
			results_loaded(res)
		}
	
	},
	
	// Retrieve events from srv_ns centred around timestamp time 
	GetEventsCentredAt: function(srv_ns, time, callback){
		var event_caps = []
		var events = []
		var num_caps
		
		var res = 60*60*12 // day
		var date = new Date(time*1000)
		var week = TL.Recurrence.GetStartOfWeek(date)
		
		function event_loaded(blob){
			if(blob) events.push(JSON.parse(blob.data.val)) 
			if(--num_caps == 0){
				console.log(events.length + " events clustered around " + time)
				
				var virtual_events = []
				
				for(var k = 0; k < events.length; k++){
					var e = events[k]
					if(!e.rule){
						virtual_events.push(e)
						continue
					}
						
					var startDay = date.getTime() - date.getHours()*(60*60*1000) - date.getMinutes()*(60*1000) - date.getSeconds()*1000	
					
					//console.log('VE: ' + new Date(startDay))
					
					e.start = new Date(startDay + e.rule['time']*1000) 
					
					//console.log('VES: ' + e.start)
					
					e.end = new Date(startDay + e.rule['time']*1000 + e.rule['duration']*1000)
					e.hash = MD5(''+e.start+e.title)
					
					virtual_events.push(events[k])
				}
				
				callback(virtual_events)
			}
		}
		
		function event_fail(){
			event_loaded(null)
		}
		
		// 0th entry is a ptr to a service profile, not an event
		
		for(var k = 1; k < srv_ns.length(); k++){
			var e = srv_ns.file(k)
			
			
			if(!e.meta()['rule']){
				// start falls in range
				if(e.meta()['start'] >= time - res && e.meta()['start'] <= time + res){
					event_caps.push(e.ptr())
					continue
				}
				// end falls in range
				if(e.meta()['end'] >= time - res && e.meta()['end'] <= time + res){
					event_caps.push(e.ptr())
					continue
				}
				// event spans range
				if(e.meta()['start'] <= time - res && e.meta()['end'] >= time + res){
					event_caps.push(e.ptr())
					continue
				}
			}else{
				if(e.meta()['start'] >= time + res)
				continue
				
				if(e.meta()['start'] <= time - res && e.meta()['end'] <= time - res && e.meta()['end'] != 0)
				continue
				
				var rule = JSON.parse(e.meta()['rule'])
				
				
				if(rule['freq'] == 'monthly'){
					if(date.getDate() == rule['daynum'])
					event_caps.push(e.ptr())	
					
				}else if(rule['freq'] == 'weekly'){
				
					if(rule['days'].indexOf(date.getDay())==-1) 
					continue
					
					
					var startWeek = TL.Recurrence.GetStartOfWeek(new Date(e.meta()['start']*1000))
					
					// does the event happen this week?
					if(Math.abs(week - startWeek) % (TL.Recurrence.msPerWeek*rule['interval']) == 0){
						event_caps.push(e.ptr())
					}
				
				}
				
				
			}
		}
		
		num_caps = event_caps.length
		
		
		if(!num_caps)
		return callback([])
		
		for(var k = 0; k < event_caps.length; k++)
			store.getfile(event_caps[k], {onResponse: event_loaded, error: event_fail})
		
		
	},
	
	///
	// Construct the Timeline widget
	///
	BuildTimeline: function(){
		
		console.log('Building Timeline...')
		
		$('#tl_no_services').hide()
		$('#tl_visual,#tl_search_container,#header').show()
		$('#tl_pane_scroll_up,#tl_pane_scroll_down').show()
		
		TL.UI._PositionStreamScrollbar()
		
		var bandInfos = []
	
			
		// month
		bandInfos.push(Timeline.createBandInfo({
			overview: true,
			eventSource: new Timeline.DefaultEventSource(),
			width: '10%',
			intervalPixels: 500,
			intervalUnit: Timeline.DateTime.MONTH
		}))
		
		// year
		bandInfos.push(Timeline.createBandInfo({
			overview: true,
			eventSource: new Timeline.DefaultEventSource(),
			width: '10%',
			intervalPixels: 700,
			intervalUnit: Timeline.DateTime.YEAR
		}))
		
		// sync month band with year
		bandInfos[1].syncWith = 0
		
		
		var tl = Timeline.create(document.getElementById('tl_timeline'), bandInfos)
		Timeline.timelines[0] = tl

		
		var height = $('#tl_timeline').height()
		var band_height = Math.floor(height * 0.10) // 10%
		var vshift = Math.floor(height * 0.80) // 80%
		tl._bands[0].setBandShiftAndWidth(vshift, band_height)
		tl._bands[1].setBandShiftAndWidth(vshift + band_height, band_height)
		tl._bands[0]._div.className = 'timeline-band timeline-band-1'
		tl._bands[1]._div.className = 'timeline-band timeline-band-2'
		
		for(var srv in TL.SourcesInstalled){
			TL.UI.AddTimelineBand(srv)
		}
		
		TL.UI.GetTimelineMonthBand()._highlight = true
		TL.UI.GetTimelineMonthBand()._positionHighlight()
		
		TL.UI.GetTimelineYearBand()._highlight = true
		TL.UI.GetTimelineYearBand()._positionHighlight()
		// handle in Add/Remove
		/*
		tl.getBand(0).addOnScrollListener(function(){
			clearTimeout(TL.ScrollTimer)
			TL.ScrollTimer = setTimeout('TL.UI.TimelineRefresh()',200)
		})
		*/
		
		$('.timeline-copyright').hide()
	},
	
	// Build service icon chicklets shown in each service band
	BuildAppLabels: function(){
		
		function icon_tag(x,y,icon,text){
			var d = document.createElement('div')
			var i = document.createElement('img')
			d.style.position = 'absolute'
			d.style.left = x + 'px'
			d.style.top = y + 'px'
			d.className = 'icon-tag'
			i.src = icon
			i.style.position = 'relative';
			i.style.top = '2px'
			//i.align='absmiddle'
			d.appendChild(i)
			d.innerHTML += text //+ '&nbsp;<input type="checkbox" checked="true" />'
			document.body.appendChild(d)
			return d
		}
		
		// clear app tags
		$('.icon-tag').remove()
		var tl = Timeline.getTimelineFromID(0)
		var tlOff = $('#tl_timeline').offset()
		var tlHeight = $('#tl_timeline').height()
		
		if(tl.getBandCount() < 3)
		return
		
		var bandHeight = Math.floor((tlHeight * 0.80) / (tl.getBandCount() - 2)) 
		var curX = tlOff.left
		var curY = tlOff.top
		
		//$('#tl_app_label').css({left:(curX)+'px', top:(curY+1)+'px'})
		//$('#tl_app_label').show()
		//curX += 105
		curX += 5;
		curY += 2;
		
		for(var id in TL.SourcesInstalled){
			var index = 0
			for(var i = 0; i < tl._bands.length; i++){
				if(tl._bands[i]._bandInfo.params['id'] == id){
					index = i
					break
				}
			}
			var elm = icon_tag(curX, curY + index * bandHeight, TL.SourcesInstalled[id].icon, '' /*TL.SourcesInstalled[id].niceName*/)
		}
	},
	
	GetTimelineMonthBand: function(){
		var tl = Timeline.getTimelineFromID(0)
		return tl._bands[ tl._bands.length - 2 ]
	},
	
	GetTimelineYearBand: function(){
		var tl = Timeline.getTimelineFromID(0)
		return tl._bands[ tl._bands.length - 1 ]
	},
	
	GetTimelineBandByID: function(id){
		var tl = Timeline.getTimelineFromID(0)
		for(var i = 0; i < tl._bands.length; i++)
			if(tl._bands[i]._bandInfo.params['id'] == id)
				return tl._bands[i]
		
		return null
	},
	GetTimelineEventElem: function(bandId, evHash){
		var B = TL.UI.GetTimelineBandByID(bandId)
		if(!B) return null
		
		// use the private index = fast
		return B._eventPainter._eventIdToElmt[evHash]
	},
	
	///
	// Add a new band with ID = id to the timeline
	///
	AddTimelineBand: function(id){
		if(TL.UI.GetTimelineBandByID(id))
			return
			
		console.log('Add Band: ' + id)
		// add a service band to the timeline
		var tl = Timeline.getTimelineFromID(0)
		var bandInfo = Timeline.createBandInfo({
			eventSource: new Timeline.DefaultEventSource(),
			width: '10%', // arbitrary, will be calculated
			intervalUnit: Timeline.DateTime.DAY,
			intervalPixels: Math.floor( screen.availWidth/1.5 ),
			params: {'paintLabels': (tl.getBandCount() == 2), 'id': id }
		})
		
		//if(!TL.UI.AddTimelineBand.weekends){
		var weekends = []
		// generate weekend highlighters
		var msPerYear = (60*60*24*365)*1000
		var start = TL.Recurrence.GetStartOfWeek(new Date(new Date().getTime() - msPerYear*2)) 
					+ TL.Recurrence.msPerDay*6 - new Date().getTimezoneOffset()*60*1000
		var end = new Date().getTime() + msPerYear*2
		
		
		while(start < end){
			weekends.push(new Timeline.SpanHighlightDecorator({
							color:"#ffffff",
							startDate: new Date(start),
							startLabel:"",
							endDate: new Date(start+TL.Recurrence.msPerDay),
							endLabel:"",
							opacity:50,
							cssClass: 'timeline-weekend-day'}))
			weekends.push(new Timeline.SpanHighlightDecorator({
							color:"#ffffff",
							startDate: new Date(start+TL.Recurrence.msPerDay),
							startLabel:"",
							endDate: new Date(start+TL.Recurrence.msPerDay*2),
							endLabel:"",
							opacity:50,
							cssClass: 'timeline-weekend-day'}))
						
			start += TL.Recurrence.msPerDay*7
		}
		
		
		bandInfo.highlight = false
		bandInfo.decorators = weekends
		bandInfo.syncWith = tl._bands.length - 1
		
		var G = new Timeline._Band(tl, bandInfo, 0);
		G.setViewLength(tl.getPixelLength())
		
		tl._bands.splice(0, 0, G) // push front

		TL.UI._DistributeTimelineBands()
		
	},
	
	RemoveTimelineBand: function(id){
		console.log('Remove Band: ' + id)
		
		var tl = Timeline.getTimelineFromID(0)
		for(var i = 0; i < tl._bands.length; i++){
			if(tl._bands[i]._bandInfo.params['id'] == id){
				tl.removeDiv(tl._bands[i]._div)
				//tl._bands[i].dispose()
				tl._bands.remove(i)			
				TL.UI._DistributeTimelineBands()
				break
			}	
		}
		return null
	},
	
	///
	// Layout and position timeline bands after add/remove. This also
	// ensures the bottom band is displaying the hour labels and that
	// a scroll listener is in place.
	///
	_DistributeTimelineBands: function(){
		var tl = Timeline.getTimelineFromID(0)
		var height = $('#tl_timeline').height() * 0.8
		var vshift = 0
		var centre
		
		// share v-space evening
		if(tl.getBandCount() > 2)
			height /= tl.getBandCount() - 2
		
		// sync new band with existing ones
		if(tl.getBandCount() > 3)
			centre = tl._bands[1].getCenterVisibleDate()
		else
			centre = new Date()
		
		// if there is only one service band, make it the scroll trigger
		if(tl.getBandCount() == 3){
			if(!tl._bands[0]._isScrollListener){
				tl._bands[0].addOnScrollListener(function(){
					clearTimeout(TL.ScrollTimer)
					TL.ScrollTimer = setTimeout('TL.UI.TimelineRefresh()',200)
				})
				tl._bands[0]._isScrollListener = true
			}
			
			TL.UI._ForcePaintBandLabels(tl._bands[0])
		}
		
		
		height = Math.floor(height)
		for(var i = 0; i < tl._bands.length - 2; i++){
			tl._bands[i].setBandShiftAndWidth(vshift, height)
			tl._bands[i].setCenterVisibleDate(centre)
			tl._bands[i]._div.className = 'timeline-band timeline-band-' + (i % 2 == 0 ? 'light' : 'dark') 
			vshift += height
		}
		for(var i = tl._bands.length - 1; i > 0; i--)
			tl._bands[i].setSyncWithBand( tl._bands[i - 1], false)
	},
	
	// Forces painting of hour labels on a band.
	_ForcePaintBandLabels: function(band){
		if(!band) return
		
		band._bandInfo.params['paintLabels'] = true
		band.paint()
	},

	// Show a synthetic dialog window
	ShowWindow: function(winId){
		// center
		TL.UI.ActiveWindow = winId
		
		function centre_window(){
			var w = document.getElementById(TL.UI.ActiveWindow)
			var left = Math.floor(window.outerWidth/2 - $(w).outerWidth()/2)+'px'
			var top = Math.floor(window.innerHeight/2 - $(w).outerHeight()/2)+'px'
			
			$(w).css('left', left)
			$(w).css('top',  top)
		}
		
		// show
		function scale_overlay(){
			$('#overlay').css({'height':window.innerHeight+'px','width':window.innerWidth+'px'})
		}
		
		$(window).resize(scale_overlay)
		$(window).resize(centre_window)
		
		scale_overlay()
		centre_window()
		
		$('#overlay').show()
		$('#'+winId).fadeIn()
		
		TL.UI._SetSyntheticButtonHandlers()
	},
	
	// Hide a dialog window
	HideWindow:function(winId){
		$('#overlay').hide()
		$('#'+winId).hide()
		TL.UI.ActiveWindow = null
	}
}

///
TL.Recurrence = {
	
	msPerDay: 60*60*24*1000,
	msPerWeek: (60*60*24*1000)*7,
	
	// Returns how many millis since midnight are represented by date
	GetTimeOfDay: function(date){
		return (date.getHours()*(60*60*1000)
			+ date.getMinutes()*(60*1000)
				+ date.getSeconds()*1000)
	},
	
	// Returns millis timestamp for most recent sunday at midnight relative
	// to date.
	GetStartOfWeek: function(date){
		var day = date.getDay()
		return date.getTime() - date.getDay() * TL.Recurrence.msPerDay 
				- TL.Recurrence.GetTimeOfDay(date)
	}
	
}

