// temp for uploaded pic cap
var profile_pic_ptr = null;


function switch_ttab(to){
	$('#trans_panel').children().hide();
	$('#'+to).fadeIn();
}

function show_ifs_auth(){
	
	switch_ttab('ifs_auth');
	flash_tooltip('#ifs_providers');
	update_ifs_providers();
}

function show_vpt_auth(){
	switch_ttab('vpt_auth');
	
	vpt_appmeta({complete: function(meta){
	    $('#profile_pic').attr('src', meta['profile.pic'] + '&_q='+new Date().getTime());
	    $('#profile_name').html(meta['profile.name']);
	    $('#connected_ifs').html(vpt_provider_nicename(vpt_get_provider()));
	}});
	
}

function show_create_account(){
 
	switch_ttab('create_account');

}

function show_new_account(){
	switch_ttab('new_account');
	flash_tooltip('#new_profile_pic', 5)
	
}

function show_request_invite(){	
	switch_ttab('request_invite');	
	
}

function update_ifs_providers(){
	
	var s = document.getElementById('ifs_providers');
	var p = vpt_get_providers();
	
	s.options.length = 0;
	for(var i = 0; i < p.length; i++){
		s.options[s.options.length] = new Option(vpt_provider_nicename(p[i]), p[i]);
	}
	
}

function add_ifs_provider(){
	
	vpt_add_provider($('#ifs_hostname').val());
	update_ifs_providers();
	$('#add_ifs_modal').modal('hide');
}

function get_account(){
	if(vpt_invited()){
	
		show_ifs_auth();
		
	}else{
		$('#request_invite_modal').modal('toggle');
	}
}

function dismiss_release_notice(){
    $('#release_note').alert('close')
	document.cookie = "vpt_notice=1";
}

function request_invite(){
	var to = $('#email').val().trim();
	if(!to){
		$('#request_invite_form').addClass('error');
		return;
	}

	function invite_success(resp){
		$('#invite_btn').button('reset');
		if(resp != '1'){
			invite_error();
		}else{
			$('#request_invite_alert').slideDown();
			$('#dismiss_request_invite').html('Finished');
			$('#request_invite_form').addClass('success');
		}
	}
	
	function invite_error(){
		$('#invite_btn').button('reset');
		$('#request_invite_form').addClass('warning');
	}
	
	$('#invite_btn').button('loading');
	
	$.ajax({
		url: '/invite/?action=request',
		type: 'POST',
		data: {'email': to},
		error: invite_error,
		success: invite_success
	})
}


function update_conn_info(provider, userid){
	
	if(provider){
	    // show connection status
	    $('#connected_icon').fadeIn();
	    $('#logout_icon').fadeIn();
	
	    $('#connected_msg').html(userid + '@' + 
		    vpt_provider_nicename(provider)).fadeIn();
		
	    flash_tooltip('#connected_msg');
	    
	}else{
	    // hide connection info
	    $('#connected_icon,#logout_icon,#connected_msg').fadeOut();
	}
		
}

function do_logout(){
	vpt_logout({complete: function(){
	    update_conn_info(null, null);
	    show_ifs_auth();
	}})
}

function do_ifs_auth(){

	var provider = $('#ifs_providers').val();
	
	// redirect...
	vpt_provider_goauth(provider);
}

function do_vpt_auth(){
    
    var password = $('#vpt_password').val().trim();
    if(password == ''){
        $('#vpt_password_cg').addClass('error');
    }else{
        vpt_login(password, {complete: function(success){
            if(success){
                do_bootstrap();
            }else{
                $('#vpt_password_cg').addClass('error');
            }
        }});
    }
}

function do_new_account(){
    // create an account and install vaportrail
    if($('#new_profile_name').val().trim() == ''){
        $('#new_profile_name_cg').addClass('error');
        return;
    }else{
        $('#new_profile_name_cg').removeClass('error');
    }
    
    if($('#new_vpt_password').val().trim() == '' ||
            $('#new_vpt_password').val().trim() != $('#new_vpt_password2').val().trim()){
        $('#new_vpt_password_cg').addClass('error');
        return;        
    }
    
    // validation passed, install
    vpt_install({'profile.name': $('#new_profile_name').val().trim(),
                 'profile.pic': $($('#new_profile_pic').children()[0]).attr('src')}, 
                 
        $('#new_vpt_password').val().trim(), 
        
        {complete: function(){
                
                console.log('vpt_install: success.');
                
                // auto login
                vpt_login($('#new_vpt_password').val().trim(), 
                 {complete: function(success){
                    if(success){
                        do_bootstrap();
                    }else{
                        // shouldn't happen :)
                        console.log('Auto-Login Failed.');
                    }
                }});
                
        }});
}

function do_bootstrap(){
    // TODO
    location.href='app.launch';
}

function check_profile_drag(event){

	event.stopPropagation();
	event.preventDefault();
	
}

function do_profile_drop(event){

	event.stopPropagation();
	event.preventDefault();
	console.log('DROP ', event);
	console.log(event.dataTransfer.files);
	
	// put the blob, save the ptr
	var capsrv = vpt_get_capservice();
	if(!capsrv){
		return;
	}		
	
	//var mime_type = event.dataTransfer.files[0].type; 
	
	capsrv.putfile(event.dataTransfer.files[0],{
		onResponse: function(resp){
			capsrv.static_url(resp.data, 'image/jpg', {
			    onResponse: function(url){
			        $('#new_profile_pic').html('<img src="'+url+'" '+
			            'class="profile-pic" style="width:64px;height:64px" />')
			    }
			})
		}
	});
	
}

vpt_ready(function(){

	// initial loading panel
	switch_ttab('loading');

	// setup tooltips
	$(document).tooltip({
		selector: '[rel="tooltip"]'
	})
	
	// enable popover bubbles
    $(document).popover({
        selector: '[rel="popover"]'
    })

	// show release notice if not dismissed
	if(document.cookie.indexOf('vpt_notice')==-1){
		$('#release_note').css('left',
			(screen.availWidth -$('#release_note').width())/2 - 25 + 'px').show();
	}
	
	// crunch for notebooks, etc
	// XXX should do vpt_responsive() to swap css
	if(vpt_is_notebook()){
		small_display();
	}

	// prime the list of personal storage providers
	vpt_prime_providers();
	
	// check if we're logged in to any known provider
	vpt_any_logged_in({
		success: function(result){
			
			vpt_debug('vpt_any_logged_in: ', result);
		    
			if(!result.length){
				// not logged in anywhere
				if(vpt_installed()){
					show_ifs_auth();
				}else if(vpt_invited()){
					show_create_account();
				}else{
					show_request_invite();
				}
			}else{
				// we are logged in
				var conn = result[0];
				
				vpt_set_provider(conn[0], conn[1]);
				
				update_conn_info(conn[0], conn[1]);
				
				dismiss_release_notice();
				
				// check if app is installed to ifs
				vpt_installed_deep({
					complete: function(installed){
						// yes
						if(installed){
							if(vpt_session()){
								do_bootstrap();
							}else{
								show_vpt_auth();
							}
						// nope
						}else{
							if(vpt_invited()){
								show_new_account();
							}else{
								show_request_invite();
							}
						}
					}
				});
			}
		}
	}) // any logged in?
	
	
})
