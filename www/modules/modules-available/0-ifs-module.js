/** ifs-module.js **/

/** This module will become Capability Explorer **/

IFS = {
	PageId : null,
	Store: null,
	CurrentPath: [],
	
	Install: function(){
		IFS.PageId = '#' + Portal.AddModule('IFS Management', IFS.Activate, IFS.Deactivate)
	
		$(IFS.PageId).html('IFS Management')
	
		IFS.Store = ifs.capservice(location.protocol+'//'+location.host+'/capsrv', Cookie.Get('ifsuserid'), location.protocol+'//'+location.host)
		IFS.Store.is_logged_in(function(result){
			if(!result.result)
			alert('Warning: You are not signed in to the capability server.')
		})
	},
	
	Activate: function(){
		
	
		/*
		$.ajax({url:'portal.service.php?service=userls',type:'POST',dataType:'json',success:function(list){
			if(!list){
				return $(IFS.PageId).html('Failed to load listing.')
			}
			
			$(IFS.PageId).html('<h2 style="font-weight:normal">'+list.length+' objects discovered.</h2>')
		}})
		
		IFS.Store.getns(null, {success: function(root_cap){
			
			IFS.BrowseNS(root_cap)
		
		}})
		*/
	},
	
	BrowseNSPath: function(path_index){
		IFS.BrowsNS(IFS.CurrentPath[path_index].cap)
	},
	
	BrowseNS: function(ns_cap){
	
		function update_path(){
			var pathHtml = ''
			$.each(IFS.CurrentPath, function(i, ns){
				pathHtml += '<a href="IFS.BrowseNSPath('+i+')">'+ns.id+'</a> /'
			})
			$('#ns_path').html(pathHtml)
		}
	
		IFS.Store.getfilelist(ns_cap, {success: function(ns_list){
		
			if(ns_list.meta['id'])
				IFS.CurrentPath.push({id: ns_list.meta['id'], cap: ns_cap})
			else
				IFS.CurrentPath.push({id: '<'+MD5(ns_cap.pack()).substr(0,15)+'>', cap: ns_cap})
		
			update_path()
			
			// ns_list.files[0] - subns
			// ns_list.files[1] - data (ptr) to something.
			
		}})
		
	},
	
	Deactivate: function(){
		return true
	}

}

$(document).ready(IFS.Install)
