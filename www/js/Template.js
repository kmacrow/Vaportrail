/**
 * Template.js
 * Provides support for basic templates
**/

Template = {
        Fill: function(tpl){
                var filled = tpl
                for(var i=1;i < arguments.length;i++){
			var obj = arguments[i]
		        for(var key in obj)
		                filled = filled.replace(new RegExp('\\$\\{'+key+'\\}','g'), obj[key])
                }
                return filled
        }
}



