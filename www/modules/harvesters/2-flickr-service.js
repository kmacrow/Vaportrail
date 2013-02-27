
function FlickrService_AuthComplete(){
	FlickrService_AuthComplete.callback(FlickrService.id,true)
}

FlickrService = {

    disabled: false,
	id: 'flickr',
	niceName: 'Flickr',
	logo: 'images/flickr-logo.png',
	icon: 'images/flickr-icon.png',
	solicitation: '<b>Flickr</b><br />Import photos from your photostream',
	
	/* service implementation... */
	login: function(callback){
		
		FlickrService_AuthComplete.callback = callback
		
		var oauth = window.open('portal.service.php?service=flickr&flickr_action=auth',
					'flickr_oauth',
					'status=0,menubar=0,toolbar=0,directories=0,scrollbars=1,height=800,width=1000')
	
		oauth.moveTo(Math.floor(window.innerWidth/2-500),200)
	},
	
	isLoggedIn: function(callback){
		//return callback(false)
		$.getJSON('portal.service.php?service=flickr&flickr_action=check_auth', function(result){
			console.log('Flickr.isLoggedIn: ', result)
			callback(result)
		})
	},
	
	initAPI: function(callback){
		callback(true)
	},
	
	getEventsSince: function(time, callback){
		FlickrService.getEvents(callback, time)
	},
	
	getEvents: function(callback){
		
		var params = [
			"me",
			{"extras": "description,date_taken,date_upload,tags,o_dims,views,url_o,url_s",
			 "min_upload_date": arguments[1] ? arguments[1] : 0}
		]
		
		$.getJSON('portal.service.php?service=flickr&flickr_action=api&flickr_api=flickr.people.getPhotos&flickr_params='+JSON.stringify(params), 
		function(result){
			//console.log(result)
			callback(FlickrService.normalizeEvents(result.photos.photo))
		})
	},
	
	normalizeEvents: function(photos){
		var events = []
		for(var i=0;i < photos.length; i++){
			var p = photos[i]
			events.push({
				type: 'flickr',
				start: new Date(parseInt(p.dateupload)*1000 - new Date().getTimezoneOffset()*60*1000),
				end: null,
				caption: p.title,
				title: '',
				icon: 'images/flickr-photo.png',
				appIcon: FlickrService.icon,
				image: p.url_s,
				stream: p.description + ' - ' + p.views + ' views',
				description: '<b>'+p.title+'</b><br />' + p.description + ' - ' + p.views + ' views<br /><br /><b>Tags:</b> ' + p.tags,
				hash: p.id
			})
		}	
			
		return events
	}	
}

TL.RegisterSource(FlickrService)

