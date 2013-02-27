var GmailService = {

    disabled: false,
	id: 'gmail',
	niceName: 'Gmail - BETA',
	logo: 'images/gmail-logo.png',
	icon: 'images/gmail-icon.gif',
	logoWidth: 180,
	solicitation: '<b>Gmail</b><br />Import your Gmail email messages',
	credentials: [],
	currentOffset: 0,
	
	/* service implementation... */
	
	UI: {
	    Login: function(){
	        GmailService.UI.callback($('#gmail_username').val(),
	                                $('#gmail_password').val());
	        $('#gmail_modal').modal('hide'); 
	        $('#settings_modal').modal('show');    
	    },
	    
	    CancelLogin: function(){
	        $('#gmail_modal').modal('hide');
	        $('#settings_modal').modal('show');
	        GmailService.UI.callback(null, null);
	    },
	    
	    ShowLogin: function(callback){
	        $('#settings_modal').modal('hide');
	        $('#gmail_modal').modal('show');
	        GmailService.UI.callback = callback;
	    }
	},
	
	login: function(callback){
	
	    GmailService.UI.ShowLogin( function(uid, pwd){
		
		    if(!uid){
		        callback('gmail', false)
		    }
		
		    $.ajax({
		        url: '/gmail/auth/',
		        data: {'username': uid, 'password': pwd},
		        type: 'POST',
		        dataType: 'json',
		        success: function(resp){
		               if(resp.status){
		                    GmailService.credentials = [uid, pwd]  
		                    callback('gmail', true)  
		               }else{
		                    callback('gmail', false)
		               }
		        }
		    })
		    
		});
	},
	
	isLoggedIn: function(callback){
		
		callback(GmailService.credentials.length != 0);
		
	},
	
	initAPI: function(callback){
		
		callback(true)
	},
	
	getEventsSince: function(time, callback){
	
		callback([])
	},
	
	getEvents: function(callback){
		
		$.ajax({
		    timeout: 30000,
		    url: '/gmail/head/?offset=0&limit=100',
		    type: 'POST',
		    data: {'username': GmailService.credentials[0], 'password': GmailService.credentials[1]},
		    dataType:'json',
		    success: function(data){
		            if(data.status){
		                GmailService.currentOffset = data.offset;
		                callback(GmailService.normalizeEvents(data.emails));
		            }else{
		               callback([])
		            }
		    }
		})
		
	},
	normalizeEvents: function(events){
	    var normal = [];
	    
	    for(var i = 0; i < events.length; i++){
	        normal.push({
	            'type': 'gmail',
	            'end': null,
	            'start': new Date(events[i].udate*1000),
	            'caption': 'Gmail Message',
	            'icon': 'images/gmail-icon.gif',
				'appIcon': GmailService.icon,
				'description': events[i].subject
	        })
	    }
	    
	    return normal;
	}

}

TL.RegisterSource(GmailService);

