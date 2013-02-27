/** defacebook-module.js **/


Deface = {
	PageId : null,
	
	Install: function(){
		Deface.PageId = '#' + Portal.AddModule('Defacebook', Deface.Activate, Deface.Deactivate)
	
		$(Deface.PageId).html('Defacebook Management')
	},
	
	Activate: function(){
	
		
	},
	
	Deactivate: function(){
		
	}

}

$(document).ready(Deface.Install)
