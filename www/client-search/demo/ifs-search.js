/*  
____  _/___  ____/__  ___/    __  ___/_____ ______ ___________________  /_ 
 __  /  __  /_    _____ \     _____ \ _  _ \_  __ `/__  ___/_  ___/__  __ \
__/ /   _  __/    ____/ /     ____/ / /  __// /_/ / _  /    / /__  _  / / /
/___/   /_/       /____/      /____/  \___/ \__,_/  /_/     \___/  /_/ /_/

*/

// Workaround for netscape.javascript.JSObject not exposing the key list.
function Object$keys(o){
	var keys = []
	if(!o) return null
	for(var k in o) keys.push(k)
	return keys.join(',');
}

// Workaround for netscape.javascript.JSObject not exposing a constructor.
function Object$new(){
	return {}
}

// Just plain handy
Object.keys = function(o){
	var keys = []
	for(var key in o) keys.push(key)
	return keys
}

// Like an old friend
Object.extend = function(d, s){
	for(var k in s)
		d[k] = s[k]
}

var search = {
	embed_path: 'client-search/demo/',
	embed_count: 0,
	embed: function(){
	
		function embed_param(k,v){
			var p = document.createElement('param')
			p.name = k
			p.value = v
			return p
		}
	
		var a = document.createElement('applet')
		a.id = 'search-'+search.embed_count
		a.code = 'org.ubc.nss.SearchApplet.class'
		a.archive = search.embed_path + 'SearchApplet.jar'
		a.width = '1' 
		a.height = '1'
		a.style.visibility = 'hidden'
		a.mayscript = 'true'
		
		a.appendChild(embed_param('mayscript','true'))
		a.appendChild(embed_param('scriptable','true'))
		a.appendChild(embed_param('start_callback', 
			'search.embed_load('+search.embed_count+')'))
		
		document.body.appendChild(a)
		search.embed_count++
		return a
	},
	
	// local namespace
	local: {},
	
	// remote namespace
	remote: {}
}


search.local.index = function(){

}

search.remote.index = function(){

}

Object.extend(search.local.index.prototype, {

})

Object.extend(search.remote.index.prototype, {

})

 



