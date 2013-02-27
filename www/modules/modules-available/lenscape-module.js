/** lenscape-module.js **/


Lenscape = {
	PageId : null,
	
	Install: function(){
		Lenscape.PageId = '#' + Portal.AddModule('Lenscapes', Lenscape.Activate, Lenscape.Deactivate)
	
		$(Lenscape.PageId).html('Lenscapes Management')
	},
	
	Activate: function(){
	
		
	},
	
	Deactivate: function(){
		
	}

}

$(document).ready(Lenscape.Install)
