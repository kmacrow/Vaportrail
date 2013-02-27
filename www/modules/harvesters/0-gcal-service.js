/**
 * Google Calendar Plugin
***/

var GCalService = {

    disabled: false,
	id: 'gcal',
	niceName: 'Calendar',
	logo: 'images/googlecal-logo.png',
	icon: 'images/google-icon.png',
	solicitation: '<b>Google Calendar</b><br />Import your Google calendar events',
	scope: 'http://www.google.com/calendar/feeds/',
	skipCalendars: ['Weather'],	// list of stupid calendars to skip
	calendars: [],
	syncCount: 1,
	
	/* service implementation... */
	login: function(callback){
		
		google.accounts.user.login(GCalService.scope);
		
	},
	
	isLoggedIn: function(callback){
		
		callback( google.accounts.user.checkLogin(GCalService.scope) )
		
	},
	
	initAPI: function(callback){
		
		callback()
	},
	
	getService: function(){
		return new google.gdata.calendar.CalendarService('vpt-gcal-import')
	},
	
	getCalendars: function(callback){
		if(GCalService.syncCount % 50 == 0 
			|| !GCalService.calendars.length){
			
			console.log("Loading all calendars...")
			GCalService.getService().getAllCalendarsFeed('http://www.google.com/calendar/feeds/default/allcalendars/full', 
			
			function(result){
				
				// clear old deck
				GCalService.calendars = []
				var entries = result.feed.entry;
				// build new deck
				console.log(entries.length + ' calendars found.')
				for (var i = 0; i < entries.length; i++) {
				  	var e = entries[i]
				  	if(GCalService.skipCalendars.indexOf(e.title.$t) == -1)
				  		GCalService.calendars.push({'id':e.title.$t,'feed':e.link[0].href,'color':e.gCal$color.value})
				}
				callback(GCalService.calendars)
				
			},
			// error
			function(e){
				console.log("GCal Feed Error (allcalendars): " + e)
				callback([])
			});
		}else{
			callback(GCalService.calendars)
		}
			
	},
	
	getEventsSince: function(time, callback){
	
		GCalService.syncCount++
		GCalService.getEvents(callback, time)
		
	},
	
	getEvents: function(callback){
		
		var numCals
		var events = []
		var gcal = GCalService.getService()
		
		var since = google.gdata.DateTime.fromIso8601(google.gdata.DateTime.toIso8601(
					new Date((arguments[1]?arguments[1]:0)*1000)))
		
		function cal_feed_loaded(id,color,entries){
			
			console.log(id + ": " + entries.length + " events.") 
			
			events = events.concat( GCalService.normalizeEvents(id,color,entries ) )
		
			if(--numCals == 0)
			callback(events)
			
		}
		
		function cal_feed_error(e){
			console.log("GCal Feed Error: " + e)
			cal_feed_loaded('','',[])
		}
		
		GCalService.getCalendars(function(cals){
			numCals = cals.length
			if(!numCals)
			callback([])
			
			console.log("Found " + cals.length + " calendars...", cals)
			
			for(var i = 0; i < cals.length; i++){
				var query = new google.gdata.calendar.CalendarEventQuery(cals[i].feed)
				query.setUpdatedMin(since)
				gcal.getEventsFeed(query, 
					eval('(function(r){cal_feed_loaded("'+cals[i].id+'","'+cals[i].color+'",r.feed.entry)})'), 
					cal_feed_error)
			}
		})
		
	},
	
	normalizeEvents:function(id,color,entries){
	
		var normal = []
		// make this expand recuring events into multiple instant events
		for(var k=0;k<entries.length;k++){
			var e = entries[k]
			
			if(e.title.$t.indexOf('JS-Client')!=-1)
			continue 
			
			if(e.gd$recurrence){
			
			    	// recurring event
			    	var recur = GCalService.parseICalRecurrence(e.gd$recurrence.$t)
			    	if(!recur['DTSTART'] || !recur['DTEND'])
			    	continue
			    		
			    	//console.log(e.gd$recurrence.$t,recur)
			    	
			    	var msPerDay = 60*60*24*1000
			    	var msPerWeek = msPerDay*7
			    	var msPerMonth = msPerWeek*4
			    	
			    	
		    		var rule = recur['RRULE'] instanceof Array ? recur['RRULE'][0] : recur['RRULE']
		    		
		    		var until = rule['UNTIL'] ? rule['UNTIL'] : 0 //recur['DTSTART'][0].getTime() + 60*60*24*365*1000 // in a year 
		    		
		    		var count = rule['COUNT'] ? rule['COUNT'] : 0
		    		
		    		var interval = rule['INTERVAL'] ? rule['INTERVAL'] : 1
		   
		    		var timeOfDayStart = (recur['DTSTART'][0].getHours() * 60*60) + (recur['DTSTART'][0].getMinutes() * 60 ) + (recur['DTSTART'][0].getSeconds()) 
		    		var timeOfDayEnd =  (recur['DTEND'].getHours() * 60*60) + (recur['DTEND'].getMinutes() * 60 ) + (recur['DTEND'].getSeconds())
		    		
		    		var evt = {
		    		 	'type': 'gcal',
					'start': null,
					'end': null,
					'durationEvent': true,
					'rule': null,
					'appIcon': GCalService.icon,
					'color': color,
					'title': e.title.$t,
					'caption': id + ': ' + e.title.$t,
					'image': 'images/gcal-event.png',
					'stream': (e['content'] ? e['content'].$t : 'No description given.'),
					'description': '<b>Location:</b> '+(e['gd$where'] && e['gd$where'][0] && e['gd$where'][0].valueString!='' ? e['gd$where'][0].valueString : 'No location specified.') + '<br />' 
								+ (e['content'] ? e['content'].$t : 'No description given.') 
				} //
		    		
		    		// monthly event by day
		    		if(rule['FREQ'] == 'MONTHLY' && rule['BYMONTHDAY']){
		    			var dayOfMonth = parseInt(rule['BYMONTHDAY'],10)
		    			
		    			
		    			evt.start = recur['DTSTART'][0]
					evt.end   = until ? until : (count ? new Date(evt.start.getTime()+count*msPerMonth*interval) : 0) // null is never
					evt.rule = {
						'freq': 'monthly',
						'daynum': dayOfMonth,
						'time': timeOfDayStart,
						'duration': timeOfDayEnd - timeOfDayStart,
						'interval': interval
					}
					
					normal.push($.extend({},evt))
		    		
		    		// weekly	
		    		}else if(rule['FREQ'] == 'WEEKLY'){
		    		
		    			console.log('PARSING EVENT: ', evt)
		    		
		    			if(rule['BYDAY']){
		    				var days = rule['BYDAY'].indexOf(',') != -1 ? rule['BYDAY'].split(",") : [rule['BYDAY']]
		    				var dayOffsets = []
		    				for(var j = 0; j < days.length; j++)
		    				dayOffsets.push( GCalService.getICalDayOffset(days[j]) )
		    			}else{
		    				var days = []
		    				var dayOffsets = [recur['DTSTART'][0].getDay()]
		    			}
		    			

			    		var startDay = recur['DTSTART'][0].getDay()
			    		var startWeek = recur['DTSTART'][0].getTime() - (startDay * msPerDay) - timeOfDayStart
		    			
		    			
		    			evt.start = recur['DTSTART'][0]
		    			evt.end =  until ? until : (count ? new Date(evt.start.getTime()+count*msPerWeek*interval) : 0) // null is never
		    			evt.rule = {
		    				'freq': 'weekly',
		    				'days': dayOffsets,
		    				'time': timeOfDayStart,
		    				'duration': timeOfDayEnd - timeOfDayStart,
						'interval': interval
					}
					
					normal.push($.extend({},evt))
		    			
		    			/*
		    			var t = startWeek
		    			
		    			if(count){
		    			
		    				for(var c = 0; c < count; c++){
		    					for(var j=0; j < dayOffsets.length; j++){
		    						var dayStart = t + dayOffsets[j] * (60*60*24*1000)
				    				var eventStart = dayStart + timeOfDayStart
				    				var eventEnd = dayStart + timeOfDayEnd
				    				evt.start = new Date(eventStart)
				    				evt.end = new Date(eventEnd)
				    				normal.push($.extend({},evt))
							}
							t += oneWeek * interval
		    				}//for
		    			
		    			}else{
			    			
				    		while(t < until){			    			
				    			for(var j = 0; j < dayOffsets.length; j++){ // for each day
				    				var dayStart = t + dayOffsets[j] * (60*60*24*1000)
				    				var eventStart = dayStart + timeOfDayStart
				    				var eventEnd = dayStart + timeOfDayEnd
				    				evt.start = new Date(eventStart)
				    				evt.end = new Date(eventEnd)
				    				normal.push($.extend({},evt))
				    			}
				    			t += oneWeek * interval // for each week
				    		}//while
			    		}//if(count)
			    		
			    		*/
		    		}
		    		
			    	
			}else{
				// one-shot event
				normal.push({
					'type' : 'gcal',
					'hash': MD5(e.title.$t),
					'start': new Date( Date.parse(e['gd$when'][0].startTime) - new Date().getTimezoneOffset()*60*1000 ),
					'end': new Date( Date.parse(e['gd$when'][0].endTime) - new Date().getTimezoneOffset()*60*1000 ),
					'durationEvent': true,
					'appIcon': GCalService.icon,
					'color': color,
					'title': e.title.$t,
					'caption': id + ': ' + e.title.$t,
					'stream': (e['content'] ? e['content'].$t : 'No description given.'),
					'description': '<b>Location:</b> '+(e['gd$where'] && e['gd$where'][0] ? e['gd$where'][0].valueString : 'No location specified.')+'<br />' 
								+ (e['content'] ? e['content'].$t : 'No description given.') 
				})
			}
		    
		}
		
		console.log(id + ': ' + entries.length + ' events normalized to ' + normal.length + ' events.') 
		console.log('NORMALIZED EVENTS: ')
		console.log(normal)
		return normal
	},
	
	parseICalRecurrence: function(rec){
		
		var r = {}
	
		var lines = rec.split("\r\n")
			
		function parse_params(params){
			if(params.indexOf(";") == -1)
			return params
			
			var p = {}
			var pairs = params.split(";")
			for(var k=0; k < pairs.length; k++){
				var pair = pairs[k].split("=")
				var key = pair[0]
				var val = pair[1]
				
				if(key == 'UNTIL') val = GCalService.parseICalDate(val)
				if(key == 'COUNT') val = parseInt(val,10)
				if(key == 'INTERVAL') val = parseInt(val,10)
				
				p[key] = val
			}
			return p
		}
		
		if(lines.length > 2){
			var line = lines[0].split(":")
			r['DTSTART'] = GCalService.parseICalDate(line[1])
			line = lines[1].split(":")
			r['DTEND'] = GCalService.parseICalDate(line[1])
		}
		
		for(var i = 2; i < lines.length; i++){
			if(lines[i] == "") 
				continue
			var line = lines[i].split(":")
			
			var key = line[0]
			var val = parse_params(line[1])
			
			if(key in r){
				if(r[key].push) 
				r[key].push(val)
				else
				r[key] = [r[key],val]
			}else{	
				r[key] = val
			}
		
		}
		return r
	},
	
	parseICalDate: function(d){
	
		var gmtDate = new Date(parseInt(d.substring(0,4)),
				parseInt(d.substring(4,6),10)-1,
				parseInt(d.substring(6,8),10),
				parseInt(d.substring(9,11),10),
				parseInt(d.substring(11,13),10),
				parseInt(d.substring(13,15),10),0)	
	
		return new Date(gmtDate.getTime() - new Date().getTimezoneOffset()*60*1000)
	},
	
	getICalDayOffset: function(day){
		var key = {'SU':0,'MO':1,'TU':2,'WE':3,'TH':4,'FR':5,'SA':6}
		var code = day.toUpperCase()
		if(code in key) return key[code]
		return 0 // sunday on error
	},
	
	searchEvents: function(events, query){
		
		var results = []
		/*
		var query = query.toLowerCase()
		for(var k=0;k < events.length;k++){
			if(events[k].title && events[k].title.toLowerCase().indexOf(query)>-1 
				|| events[k].description && events[k].description.toLowerCase().indexOf(query)>-1)
					results.push(events[k])
		}
		*/
		return results;
	}

}

TL.RegisterSource(GCalService)

