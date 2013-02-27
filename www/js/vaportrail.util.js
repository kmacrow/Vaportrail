/**
 * vaportrail.util
**/
var VPT_VERSION = "0.1 ALPHA";
var VPT_SPONSORED = "http://vaportrail.nss.cs.ubc.ca:8080";

var VPT_PROV_LSKEY = 'vpt_providers';
var VPT_PROV_SSKEY = 'vpt_provider';

var vpt_ready_q = [];
var vpt_ready_bar = 2; // ifs, document
var vpt_capsrv = null;
var vpt_provider = null;

var vpt_debug_enabled = true;

function vpt_debug() {
    var e;
    var location;
    var match;
    var args;
    
    if (!!!vpt_debug_enabled)
        return;

    try { "eat".dirt(); } catch (e) {
        //e.g. "    at http://vtapp.ifs/js/vaportrail.landing.js:277:4"
        //e.g. "    at complete (http://vtapp.ifs/js/vaportrail.util.js:353:23)"
        location = e.stack.split("\n")[2];
        match = (/at ([^ ]+ )?\(?[a-zA-Z:]+\/\/[^\/]+([\/].*)\)?$/).exec(location);
        if (match && match.length > 1) {
            if (match[1] !== undefined)
                location = "DBG " + match[1] + "(" + match[2] + "): ";
            else
                location = "DBG " + match[2] + ": ";
        } else {
            location = "DBG ";
        }

        args = [location].concat(Array.prototype.slice.call(arguments));
        if (console && console.debug)
            console.debug.apply(console, args);
    }
};



function vpt_set_provider(provider, userid){
    sessionStorage[VPT_PROV_SSKEY] = provider;
    sessionStorage['vpt_provider_userid'] = userid;
    //vpt_capsrv = vpt_create_capservice(provider, userid);
}

function vpt_get_capservice(){

    if(sessionStorage[VPT_PROV_SSKEY]){
        return vpt_create_capservice(vpt_get_provider(),
                                     sessionStorage['vpt_provider_userid']);
    }else{
        return null;
    }
                                           	

}

function vpt_get_provider(){
    
    return sessionStorage[VPT_PROV_SSKEY];
}


function vpt_invited(){
	
	return true
	//return document.cookie.indexOf('__vpti') != -1;
}

function vpt_session(){
	
	return 'vpt_pkey' in sessionStorage;
}

function vpt_login(password, options){
    
    vpt_appmeta({ complete: function(meta){
        if(!meta){
            return options.complete(false);
        }
        
        vpt_debug('vpt_login: (meta): ', meta);
        
        try{
            var pkey = sjcl.decrypt( password, atob( meta['install.pkey'] ) );
        }catch(e){
            options.complete(false);
            return;
        }


        sessionStorage['vpt_pkey'] = pkey;
        options.complete(true);
        
    }})
}

function vpt_install(metax, password, options){
    
    var pkey = vpt_generate_pkey();
    
    var time = new Date().getTime();
    
    var meta = {
        'indices': '{}',
        'install': time,
        'install.time': time,
        'install.version': VPT_VERSION,
        'install.pkey': btoa(sjcl.encrypt(password, pkey)),
        
    }
    
    meta = $.extend(meta, metax);
    
    if (vpt_debug_enabled)
        vpt_debug("vpt_install", JSON.stringify(meta));

    var ns = new ifs.objects.CapList();
    ns.meta(meta);
    
    // install the app
    vpt_appns(ns, {complete: function(){
        vpt_installed(true);
        options.complete();
    }})

}

function vpt_uninstall(){
    
    var capsrv = vpt_get_capservice();
    
    vpt_get_appnsptr({complete: function(ptr){
           capsrv.putptr(ptr, null, {onResponse: function(resp){
                sessionStorage.clear();
                localStorage.clear();
                console.log('vpt_uninstall: ', resp);
           }})
    }});
}

function vpt_installed(p){	
	
	if(p == undefined){
	    return localStorage['vpt_installed'] == '1' ? true : false;
	}else{
	    localStorage['vpt_installed'] = p ? '1' : '0';
	    return p;
    }
	
}


function vpt_installed_deep(options){

	vpt_appns({
		complete: function(ns){
			options.complete(ns ? true : false);	
		}	
	});

}


// get the app's namespace pointer
function vpt_get_appnsptr(options){
    
    function complete(){
		if(options.complete)
			options.complete.apply(this, arguments);
	}
	
	var capsrv = vpt_get_capservice();

	if(!capsrv){
		return complete(null);
	}
	
	capsrv.getns(null, { onResponse: function(resp){
	    capsrv.getfilelist(resp.data, { onResponse: function(resp){
	        complete(resp.data.file(1).ptr());
	    }})
	}});	
}

// get/set the app's namespace
function vpt_appns(){

    var capsrv = vpt_get_capservice();

    var options = arguments[1] ? arguments[1] : arguments[0];
    var ns = arguments[1] ? arguments[0] : null;
    
    vpt_get_appnsptr({ complete: function(ptr){
	    if(!ns){
	        // get the current ns
	        capsrv.getptrd(ptr, { onResponse: function(resp){
	            options.complete(resp.data);
	        } });
	    
	    }else{
	        // set the new one
	        capsrv.putfilelist(ns, {onResponse: function(resp){
                    capsrv.putptr(ptr, resp.data, {onResponse: function(resp){
                        options.complete(ns);
                    } });
                } });
	    }
	    
	} }); 
}


// get/put the app meta data
// set: vpt_appmeta(new_meta_obj, options)
// get: vpt_appmeta(options) 
function vpt_appmeta(){
    
    var options = arguments[1] ? arguments[1] : arguments[0];
    var meta = arguments[1] ? arguments[0] : null;
    
    vpt_appns({ complete: function(ns){
        if(!ns){
            vpt_debug("No metadata found.");
            return options.complete(null);
        }
        
        if(meta){
            ns.meta(meta);
            vpt_appns(ns, { complete: function(){
                options.complete(meta);
            } });
            
        }else{
            options.complete(ns.meta());
        }
        
    } });

}


function vpt_create_capservice(provider){
	
	var capservice = new ifs.Capservice(provider+'/capsrv',
				arguments[1]?arguments[1]:'dummy',
				'vaportrail',location.protocol + '//' + 
				location.host,{});
	
	return vpt_extend_capservice(capservice);
}

function vpt_add_provider(p){

    var pv = vpt_get_providers();
    
    p = p.trim();

    if (!p.match(/^http:\/\//) && !p.match(/^https:\/\//)) {
        p = "http://" + p;
    }

    if (pv.indexOf(p) == -1) {
	pv.splice(0, 0, p);
	localStorage[VPT_PROV_LSKEY] = JSON.stringify(pv);
    }
}

function vpt_get_providers(){
	
	if(VPT_PROV_LSKEY in localStorage){
		return JSON.parse(localStorage[VPT_PROV_LSKEY]);
	}else{
		return [];
	}
}

function vpt_prime_providers(){
    
    var prov = vpt_get_providers();
    var i;
    var found = 0;

    if (prov.indexOf(VPT_SPONSORED) === -1) {
        prov.push(VPT_SPONSORED);
    }

    localStorage[VPT_PROV_LSKEY] = JSON.stringify(prov);
}

function vpt_provider_nicename(p){
    var toks = p.split("://");
    var domport = null;

    domport = toks[toks.length - 1];

    toks = domport.split(":");
    return toks[0];
}

function vpt_provider_goauth(p){

    var domain, auth_url;
        
    p = p || "";
    domain = location.protocol + '//' + location.host;

    auth_url = 
	p + '/?'+
	'appdomain=' + domain +
	'&appuser=vaportrail'+
	'&redirect='+ domain;

    location.href = auth_url;
}

function vpt_generate_pkey(){
    var charlist = "a1AbcB2_dC(e3D)fg@E4h%Fi5^GjkH6=lIm7/JnoK8p|Lq9MrsNtuOvw"
                        +"PxyQzR!ST*UV&WX$Y-Z+";
    var keylen = arguments[0] ? arguments[0] : 128;
    var key = '';
    for(var i = 0; i < keylen; i++){
        key += charlist.charAt(Math.floor(Math.random()*charlist.length));
    }
    return key;
}

function vpt_logout(options){
    
    function complete(){
		if(options.complete)
			options.complete.apply(this, arguments);
	}
	
	var capsrv = vpt_get_capservice();
	if(!capsrv){
	    complete(null);
	    return;
	}   
	
	sessionStorage.clear();
	capsrv.logout({onResponse: complete})
	
}

function vpt_logged_in(provider, options){

    function complete(){
	if(options.complete)
	    options.complete.apply(this, arguments);
    }

    var capsrv = vpt_create_capservice(provider);

    capsrv.is_logged_in({
	onResponse: function(resp){
	    complete( resp.status == 'NO_SESSION' ? 
		      null : resp.data.userid)
	    
	} 
    });
	
	
}

function vpt_any_logged_in(options){

    var providers = vpt_get_providers();
    var barrier = providers.length;
    var result = [];
    
    function success(){
	if(options.success)
	    options.success.apply(this,arguments);
    }

    function complete(){
	if(--barrier == 0){
	    success(result);
	}
    }

    if(!barrier){
	success(result);
    }	
    
    $.each(providers, function(i, provider){
	vpt_logged_in(provider, {
	    complete: function(userid) {
		if(userid){
                    result.push([provider,userid]);
		}
		complete();
	    }
	});
    });
}

function vpt_is_notebook(){
	
	return screen.height < 1000;
}


function vpt_ready(fn){

	vpt_ready_q.push(fn)
}

function vpt_lower_ready_bar(){

	if(--vpt_ready_bar == 0){
		for(var i = 0; i < vpt_ready_q.length; i++){
			vpt_ready_q[i]();
		}
	}
}


/**
 * vaportrail.ifs
**/

// extend capservice instance with vaportrail extensions
function vpt_extend_capservice(capservice){
	
	capservice.getptrd = vpt_ifs_getptrd;
	capservice.static_url = vpt_ifs_static_url;
	// others...
	
	return capservice;

}


// dereference pointer extension
function vpt_ifs_getptrd(ptr, options){

	function callback(){
		if(options.onResponse)
			options.onResponse.apply(this, arguments);
	}
	
	var $this = this;

	this.getptr(ptr, {
		onResponse: function(resp){
			if(resp.data){
				$this.getv(resp.data, {
					onResponse: function(resp){
						callback(resp);
					}
				});
			}else{
				callback(resp);
			}
		}
	});	
	
}

function vpt_ifs_static_url(ptr, ct, options){
    
    function callback(){
        if(options.onResponse)
			    options.onResponse.apply(this, arguments);
    }
    
    var $this = this;
    
    this.getcap(ptr, {}, {
        onResponse: function(resp){
            console.log($this);
            callback($this['__gwt_instance']['b']['e'] + '/getv/' + escape(resp.data.pack()) + '?ct='+ct);
        }
    });
}




/**
 * vaportrail.common
**/

function small_display(){
				
	$('.copy-container').
	removeClass('copy-container').
	addClass('copy-container-small');
	
	$('#footer1').css('height', '10px');
	$('#footer2').css('height', '10px');
	$('#branding').css('bottom', '30px');
	$('#release_note').hide();
}

function flash_tooltip(elem){
    $(elem).tooltip('show')
    setTimeout(function(){
        $(elem).tooltip('hide');
    }, arguments[1] ? arguments[1]*1000 : 3000);
}


// bootstrap
$(document).ready(vpt_lower_ready_bar);
function ifsOnLoad(){vpt_lower_ready_bar();}


