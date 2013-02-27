/** facebook-module.js **/


FBM = {
	PageId: null,
	Profile: null,
	Timeline: null,
	TimelineEventSource: null,
	
	Install: function(){
	
		FBM.PageId = '#' + Portal.AddModule('Facebook', FBM.Activate, FBM.Deactivate)
	
		FB.init({appId: '118814521536841', status: true, cookie: true, xfbml: true});
  		
		// facebook tab ui
		$.get('modules/facebook-module/facebook.html?_='+new Date().getTime(), function(html){
			$(FBM.PageId).html(html)
		})
		
	},
	
	Activate: function(){
		
		FB.getLoginStatus(function(resp){
			if(resp.session)
				FB.api('/me', FBM.ShowSplash)
			else{
				$('#fb_import_prompt,#fb_importing').hide()
				$('#fb_login_prompt').show()
			}
			
		})
		
	},
	
	Deactivate: function(){
		return true
	},
	
	DoLogin: function(){
		FB.login( function(resp){
			if(resp.session){
				FB.api('/me', FBM.ShowSplash)
			}
		}, 
		{perms: 'user_notes,user_photos,user_status,user_videos,read_mailbox,read_stream'})	
	},
	
	ShowSplash: function(profile){
		FBM.Profile = profile
		
		$('span[id^="fbname"]').each(function(){$(this).html(profile['first_name'])})
		$('img[id^="fbpic"]').each(function(){$(this).attr('src', 'https://graph.facebook.com/'+profile['id']+'/picture')})
		
		$('#fb_login_prompt').hide()
		$('#fb_import_prompt').fadeIn()
		
		// Show the timeline if data exists
		FBM.DoTimeline()
	},
	
	DoImport: function(){
		$('#fb_import_prompt').fadeOut('fast', function(){
			$('#fb_importing').fadeIn()
		})
		
		$('#fb_visual').fadeOut()
		$('#fb_importing_status').html('Downloading from Facebook&trade;')
		
		var statuses, notes, threads, messages, albums, photos, posts, post_comments, photo_comments, videos;
		var session = FB.getSession()
		
		// jesus the FQL API is sexy (statuses back a month)
		statuses = FB.Data.query('select uid,status_id,time,message,source from status where uid = me() and time > now() - 2592000')
		
		// get user notes
		notes = FB.Data.query('select uid,note_id,created_time,updated_time,content,title from note where uid = me()')
		
		// get threads in inbox
		threads = FB.Data.query('select thread_id,subject,recipients,updated_time,message_count,snippet from thread where folder_id = 0 limit 100')
		
		// get messages associated with threads (note subquery)
		messages = FB.Data.query('select message_id,thread_id,author_id,body,created_time from message where thread_id'
						+' in ( select thread_id from {0} )', threads)
		
		// get photo albums
		albums = FB.Data.query('select aid,cover_pid,name,created,modified,description,location,size,type from album where owner = me()')
		
		// and photos in those albums
		photos = FB.Data.query('select pid,aid,object_id,owner,src_small,src,caption,created,modified from photo where aid in (select aid from {0})', albums) 
		
		// stream/wall posts (..where target_id != source_id)
		posts = FB.Data.query('select post_id,created_time,updated_time,actor_id,target_id,message,likes,attachment from stream where source_id = me()')
		
		// get videos
		videos = FB.Data.query('select vid,title,description,thumbnail_link,updated_time,created_time,embed_html,src,src_hq from video where owner = me()')
		
		// get post comments
		post_comments = FB.Data.query('select fromid,time,text from comment where post_id in (select post_id from {0})', posts)
		
		// get photo comments
		photo_comments = FB.Data.query('select fromid,time,text from comment where object_id in (select object_id from {0})', photos)
		
		var queries = [statuses, notes, threads, messages, albums, photos, posts, videos, post_comments, photo_comments]
		
		// execute the queries
		FB.Data.waitOn(queries, function(){
			
			
			$('#fb_importing_status').html('Uploading to ' + location.host)
			
			/// push up to capsrv
			if( !IFS.Store ){
				$('#fb_importing_spin').css({'visibility':'hidden'})
				$('#fb_importing_status').html('There is no capability service available.')
				return
			}
			
			// create a facebook namespace
			var fb_ns = new ifs.objects.Filelist()
			var fb_ns_count = 10
			fb_ns.meta['type'] = 'list'
			fb_ns.meta['name'] = 'facebook-' + Math.floor(new Date().getTime()/1000)
			
			function build_list(id, records, callback){
				var list = new ifs.objects.Filelist()
				var count = records.length
				list.meta['type'] = 'list'
				list.meta['id'] = id
				
				
				if(!count)
				return callback(id, list)
				
				for(var i=0; i < records.length; i++){
					IFS.Store.putfile(JSON.stringify(records[i]), {success: function(cap){
						list.add(cap)
						count--
						
						//console.log(list.meta['name'] + ': ' + cap.toString())
						
						if(count == 0){
							//console.log(list.meta['name'] + ': Complete')
							callback(id, list)
						}
						
					}})
				}
				
			}
			
			function list_complete(id, list){
				
				IFS.Store.putfilelist(list, {success: function(list_cap){
				
					// FIXME the api should support per-entry meta data
					fb_ns.files.push({'ptr': list_cap, 'meta': {'id': id}})
					fb_ns_count--
					
					//console.log('Stored ' + list.meta['name'] + ': ' + list_cap.toString())
					
					if(fb_ns_count == 0)
					put_facebook_ns()	
				}})
				
			}
			
			function put_facebook_ns(){
				
				IFS.Store.putfilelist(fb_ns, {success: function(fb_ns_cap){
					
					IFS.Store.getns(null, {success: function(user_ns_cap){
						
						IFS.Store.getfilelist(user_ns_cap, {success: function(user_ns){
							
							IFS.Store.putptr(user_ns.files[1].ptr, fb_ns_cap, {success: function(){
								
								$('#fb_importing').hide()
								$('#fb_import_complete').fadeIn()	
							}})
							
						}})
			
					}})
					
					
				}})
				
			}	
			
			IFS.Store.putfile(JSON.stringify(FBM.Profile), {success: function(profile_cap){
				
				// put the profile in the zero slot 
				fb_ns.add(profile_cap)
				
				// build the lists from FB query result sets
				build_list('status', statuses.value,  list_complete)
				build_list('thread', threads.value,  list_complete)
				build_list('message', messages.value,  list_complete)
				build_list('album', albums.value,  list_complete)
				build_list('photo', photos.value,  list_complete)
				build_list('post', posts.value,  list_complete)
				build_list('video', videos.value,  list_complete)
				build_list('note', notes.value,  list_complete)
				build_list('post_comment', post_comments.value,  list_complete)
				build_list('photo_comment', photo_comments.value,  list_complete)	
				
			}})
			
			
		})
		
		
	},
	
	DoTimeline: function(){
		IFS.Store.getns(null, {success: function(user_ns_cap){
			
			IFS.Store.getfilelist(user_ns_cap, {success: function(user_ns){
				
				IFS.Store.getptr(user_ns.files[1].ptr, {success: function(fb_list_cap){
				
					if(!fb_list_cap)
					return
				
					IFS.Store.getfilelist(fb_list_cap, {success:function(fb_list){
						
						console.log(fb_list)
						//$('#fb_import_complete').hide()
						$('#fb_loading_spin').show()
						
						
						if(fb_list.files.length != 11)
						return console.log("Invalid Facebook NS")
						
						var fb_data = {}
						var fb_list_count = fb_list.files.length - 1 // profile is entry 0 = not a list
						
						function load_list(id, list_cap, callback){
							
							IFS.Store.getfilelist(list_cap, {success: function(list){
							
								//console.log(id + ' ('+list.files.length+' items)')
								
								var count = list.files.length
								var result = []
								
								if(!count)
								callback(id, [])
								
								for(var i = 0; i < list.files.length; i++){
									IFS.Store.getfile(list.files[i].ptr, {success: function(blob){
										result.push(JSON.parse(blob))
										count--
										if(count == 0)
										callback(id, result)
									}})
								}
									
										
							}})
						} ///
						
						function list_loaded(id, list){
							//console.log(id + ' loaded: ' + list)
							fb_data[id] = list
							fb_list_count--
							if(fb_list_count == 0)
							load_timeline_events()
						}
						
						function load_timeline_events(){
							// do stuff with fb_data
							var events = []
							
							///
							function event(ts, ico, caption, title, desc){
								return {
									'start': new Date( (typeof ts == 'string' ? parseInt(ts)*1000 : ts * 1000) ),
									'durationEvent': false,
									'icon': 'images/'+ico,
									'title': title,
									'caption': caption,
									'description': desc	
								}
							}
							
							function truncate(text, len){
								if(text.length < len) return text
								return text.substr(0, len) + '...'
							}
							
							$.each(fb_data['status'], function(i, status){
								events.push( event(status.time, 'fb-status.png', status.message, '', 
									'Status update: ' + status.message) )
							}) 
							
							$.each(fb_data['thread'], function(i, thread){
								events.push( event(thread.updated_time, 'fb-thread.png', 
									'Message Thread (' + thread.message_count + ' messages)',
									'', 
									'Message thread updated ('+thread.message_count+' messages).' ) )
							})
							
							$.each(fb_data['message'], function(i, message){
								events.push(
									event(message.created_time, 'fb-message.png',
									'Message',
									'',
									'Message: ' + truncate(message.body,140) ) 
								)
							})
							
							$.each(fb_data['album'], function(i, album){
								events.push(
									event(album.created, 'fb-album.png', 
									album.name + ' (' + album.size + ' photos)',
									'',
									'Photo album "'+album.name+'": ' + album.size + ' photos.') 
								)
							})
							
							$.each(fb_data['photo'], function(i, photo){
								var e = event(photo.created, 'fb-photo.png', 
									'Photo', '', 'Photo <'+photo.pid+'>')
								
								e.image = photo.src_small
								events.push(e)
							})
							
							$.each(fb_data['note'], function(i, note){
								events.push(event(
									note.created_time, 'fb-note.png', note.title, '', 
									'<b>'+note.title+'</b><br />'+truncate(note.content,140)
								))
							})
							
							$.each(fb_data['post_comment'].concat(fb_data['photo_comment']), function(i, comment){
								events.push(event(
									comment.time, 'fb-comment.png', 'Comment', '',
									comment.text
								))
							})
							
							//console.log(events)
							
							$('#fb_visual').fadeIn('fast', function(){
								FBM.BuildTimeline(events)
							})
							
							
							$('#fb_import_complete').hide()
							$('#fb_import_prompt').show()
							$('#fb_loading_spin').hide()
							
						}
						
						// ...
						IFS.Store.getfile(fb_list.files[0].ptr, {success:function(profile){
							//console.log(profile)
							FBM.Profile = JSON.parse(profile)
							
							for(var k = 0; k < fb_list.files.length; k++)
								load_list(fb_list.files[k].meta['id'], fb_list.files[k].ptr, list_loaded)
								
						}})
						// ...
						
						
					}})	
				
				}})
				
			}})
			
		}})
	},
	
	BuildTimeline: function(events){
		
	
		var fbEvents = new Timeline.DefaultEventSource()
		fbEvents.loadJSON({'dateTimeFormat': 'Gregorian',
				   'wikiURL': "http://simile.mit.edu/shelf/",
				   'wikiSection': "Facebook",
				   'events': events}, '.')
		
		var bandInfos = [
			Timeline.createBandInfo({
				eventSource: fbEvents,
				width: '70%',
				intervalUnit: Timeline.DateTime.DAY,
				intervalPixels: 150
			}),
			Timeline.createBandInfo({
				eventSource: fbEvents,
				overview: true,
				width: '15%',
				intervalUnit: Timeline.DateTime.MONTH,
				intervalPixels: 300
			}),
			Timeline.createBandInfo({
				eventSource: fbEvents,
				overview: true,
				width: '15%',
				intervalUnit: Timeline.DateTime.YEAR,
				intervalPixels: 500
			})
		]
	
		bandInfos[1].syncWith = 0
		bandInfos[1].highlight = true
		bandInfos[2].syncWith = 1
		bandInfos[2].highlight = true
	
		FBM.Timeline = Timeline.create(document.getElementById('fb_timeline'), bandInfos)
		$('.timeline-copyright').hide()
		
		
	}

}

$(document).ready(FBM.Install)
