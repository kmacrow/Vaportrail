/**
 * Facebook Plugin
***/

var FBService = {

	id: 'facebook',
	niceName: 'Facebook',
	logo: 'images/facebook-logo.png',
	icon: 'images/facebook-icon.png',
	solicitation: '<b>Facebook</b><br />Import posts, messages and statuses',
	
	/* service implementation... */
	login: function(callback){
		
		FB.login( function(resp){
			callback('facebook',resp.authResponse?true:false)
		}, 
		{perms: 'user_notes,user_photos,user_status,user_videos,user_events,read_mailbox,read_stream'})		
	
	},
	
	isLoggedIn: function(callback){
		
		FB.getLoginStatus(function(resp){
			//callback(resp.session?true:false)
			console.log('getLoginStatus() returned...')
			if(resp.status == 'connected'){
				callback(true)
			}else{
				callback(false)
			} 
		})
	},
	
	initAPI: function(callback){
		callback()
	},
	
	getEventsSince: function(time, callback){
		
		FBService.getEvents(callback, time)
		//FBService.__getEventsSince(time, callback)
		
	},
	
	getEvents: function(callback){
		var events = []
		var since = arguments[1] ? arguments[1] : 0
		
		var statuses, notes, threads, messages, albums, photos, posts, post_comments, photo_comments, videos, fbevents;
		
		//var session = FB.getSession()
		
		//console.log("Getting events since " + new Date(since*1000) + "...")
		
		// statuses back a month
		statuses = FB.Data.query('select uid,status_id,time,message,source from status where uid = me() and time > '+ (since==0?'now() - 2592000':since) )
		
		
		// get user notes
		notes = FB.Data.query('select uid,note_id,created_time,updated_time,content,title from note where uid = me() and created_time > '+since)
		
		
		// get threads in inbox
		threads = FB.Data.query('select thread_id,subject,recipients,updated_time,message_count,snippet,parent_thread_id from thread where folder_id = 0 and updated_time > '+since+' limit 20')
		
		
		// get messages associated with threads (note subquery)
		messages = FB.Data.query('select message_id,thread_id,author_id,body,created_time from message where thread_id'
						+' in ( select thread_id from {0} )', threads)
		
		
		// get photo albums
		albums = FB.Data.query('select aid,cover_pid,name,created,modified,description,location,size,type from album where owner = me() and created > '+since)
		
		// and photos in those albums
		photos = FB.Data.query('select pid,aid,object_id,owner,src_small,src,caption,created,modified from photo where aid in (select aid from {0})', albums) 
		
		
		// stream/wall posts (..where target_id != source_id)
		if(!since)
			posts = FB.Data.query('select post_id,created_time,updated_time,actor_id,target_id,message,likes,attachment from stream where source_id = me()')
		else
			posts = FB.Data.query('select post_id,created_time,updated_time,actor_id,target_id,message,likes,attachment from stream where source_id = me() and updated_time > ' +since)
		
		
		// get videos
		videos = FB.Data.query('select vid,title,description,thumbnail_link,updated_time,created_time,embed_html,src,src_hq from video where owner = me() and created_time > '+since)
		
		// get post comments
		post_comments = FB.Data.query('select fromid,time,text from comment where post_id in (select post_id from {0})', posts)
		
		// get photo comments
		if(!since)
			photo_comments = FB.Data.query('select fromid,time,text from comment where object_id in (select object_id from {0}) limit 50', photos)
		else
			photo_comments = {value:[]}
		
		// get events
		/*
		fbevents = FB.Data.query('select eid,name,tagline,pic_small,host,description,start_time,end_time,location,update_time from event'
						+' where eid in (select eid from event_member where uid = me() and rsvp_status="attending") and update_time > '+since+' limit 100')
		*/
		//fbevents = FB.Data.query('select eid from event_member where uid = me() and rsvp_status="attending" limit 50')
		/*
		var queries = [statuses, notes, threads, messages, albums, photos, posts, videos, fbevents, post_comments, photo_comments]
		*/
		
		var queries = [statuses,notes,threads,messages,albums,photos,posts,videos,post_comments]
		if(!since)
			queries.push(photo_comments)
		
		//FB.Data.waitOn([statuses],function(){console.log("statues complete.")})
		/*
		FB.Data.waitOn([notes],function(){console.log("notes complete.")})
		FB.Data.waitOn([threads],function(){console.log("threads complete.")})
		FB.Data.waitOn([messages],function(){console.log("messages complete.")})
		FB.Data.waitOn([albums],function(){console.log("albums complete.")})
		FB.Data.waitOn([photos],function(){console.log("photos complete.")})
		FB.Data.waitOn([posts],function(){console.log("posts complete.")})
		FB.Data.waitOn([videos],function(){console.log("videos complete.")})
		FB.Data.waitOn([post_comments],function(){console.log("post comments complete.")})
		FB.Data.waitOn([photo_comments],function(){console.log("photo comments complete.")})
		*/
		//callback([])
		//return
		// execute the queries
		FB.Data.waitOn(queries, function(){
			
			
			function merge(){
				var R = []
				for(var i=0;i<arguments.length;i++)
				R = R.concat(arguments[i])
				return R
			}
			//console.log(fbevents.value)
			
			// merge into one normalize event stream
			events = merge(FBService.normalizeEvents(statuses.value,'status'),
				       FBService.normalizeEvents(notes.value,'note'),
				       FBService.normalizeEvents(threads.value,'thread'),
				       FBService.normalizeEvents(messages.value,'message'),
				       FBService.normalizeEvents(albums.value,'album'),
				       FBService.normalizeEvents(photos.value,'photo'),
				       FBService.normalizeEvents(posts.value,'post'),
				       FBService.normalizeEvents(videos.value,'video'),
				       FBService.normalizeEvents(post_comments.value,'post_comment'),
				       FBService.normalizeEvents(photo_comments.value,'photo_comment'))
			
			callback(events)
		})
		
	},
	
	normalizeEvents: function(events, type){
		
		function truncate(text, len){
			if(text.length < len) return text
			return text.substr(0, len) + '...'
		}
		
		function parse_date(ts){
			return new Date( (typeof ts == 'string' ? parseInt(ts)*1000 : ts * 1000) - new Date().getTimezoneOffset()*60*1000 ).toString()
		}
		
		function xtend(d,s){
			for(var k in s) d[k] = s[k]
			return d
		}
		
		var normal = []
		
		for(var k = 0; k < events.length; k++){
			var e = events[k]
			e.appIcon = FBService.icon
			e.type = 'facebook'
			
			
			switch(type){
				case 'status':
					e = xtend(e, {'hash':MD5(e.message),'start': parse_date(e.time),'end': null, 'icon':'images/fb-status.png', 'caption': 'Facebook update', 'description': e.message})
				break
				case 'note':
					e = xtend(e, {'hash':MD5(e.content),'start': parse_date(e.created_time),'end':null, 'icon':'images/fb-note.png','caption':e.title,'title':'','description':'<b>'+e.title+'</b><br />'+truncate(e.content,140)
								+'<br /><a href="http://www.facebook.com/note.php?note_id='+e.note_id+'" target="_blank">View on Facebook</a>', 'stream':truncate(e.content,140)})
				break
				case 'thread':
					e = xtend(e, {'start': parse_date(e.updated_time), 'end':null, 'icon':'images/fb-thread.png', 'caption':'Message Thread (' + e.message_count + ' messages)','description': e.message_count + ' messages'
								/*+' <a href="http://www.facebook.com/?sk=inbox&action=read&tid='+e.thread_id+'" target="_blank">View on Facebook</a> '*/ , 'stream': 'Facebook message thread.' })
				break
				case 'message':
					e = xtend(e, {'hash':MD5(''+e.created_time+e.body),'start': parse_date(e.created_time), 'end':null, 'icon':'images/fb-message.png','caption':'Message','description':truncate(e.body,140)
								/*+'<br /><a href="http://www.facebook.com/?sk=inbox&action=read&tid='+e.thread_id+'" target="_blank">View thread on Facebook</a>'*/})
				break
				case 'album':
					e = xtend(e, {'start': parse_date(e.created), 'end':null, 'icon':'images/fb-album.png', 'caption': e.name + ' (' + e.size + ' photos)', 'description':e.size + ' photos:'
								+' <a href="http://www.facebook.com/media/set/?set='+e.aid+'" target="_blank">View on Facebook</a>'})
				break
				case 'photo':
					e = xtend(e, {'start': parse_date(e.created), 'end':null, 'icon':'images/fb-photo.png', 'caption':'Photo', 
							'description': '<a href="http://www.facebook.com/photo.php?fbid='+e.object_id+'&set='+e.aid+'&type=1&theater" target="_blank">View photo on Facebook</a>',
							'image':e.src_small, 'stream': '<img src="'+e.src_small+'" style="width:48px;" />'})
				break
				case 'post':
					e = xtend(e, {'hash':MD5(e.message),'start': parse_date(e.created_time), 'end':null, 'icon':'images/fb-post.png','caption':'Facebook post','description': e.message})
				break
				case 'video':
					e = xtend(e, {'start': parse_date(e.created_time), 'end':null,'icon':'images/fb-video.png','caption':e.title,'description':e.description})
				break
				case 'event':
					e = xtend(e, {'start': parse_date(e.start_time), 'end': parse_date(e.end_time),'durationEvent':true, 'icon':'images/gcal-event.png','caption':e.name,'description':e.description})
				break
				case 'post_comment':
				case 'photo_comment':
					e = xtend(e, {'hash':MD5(''+e.time+e.text),'start': parse_date(e.time), 'end':null, 'icon':'images/fb-comment.png','caption':'Comment','description':e.text})
				break
			}
			
			normal.push(e)
		}
		
		return normal
	},
	
	searchEvents: function(events, query){
		var results = []
		
		
		return results
	}

}

TL.RegisterSource(FBService)

$(document).ready(function(){
	FB.init({appId: '162052063906900', status: false, cookie: true, xfbml: false})
})

