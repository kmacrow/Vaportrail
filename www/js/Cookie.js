var Cookie = {}

Cookie.Set = function(key, value){
	var expires = ""		
	if(arguments[2]){
		var date = new Date()
		date.setTime(date.getTime() + (arguments[2] * 86400000))
		expires = "; expires=" + date.toGMTString()				
	}
	document.cookie = key + "=" + escape(value) + expires + "; path=/"
}

Cookie.Get = function(key){
	var matches = new RegExp(key + "=([^;]+)").exec(document.cookie)
	return matches ? unescape(matches[1]) : '' 
}

Cookie.Erase = function(key){
	Cookie.Set(key,'',-1)
}

Cookie.Exists = function(key){
	return (Cookie.Get(key) != '')
}

