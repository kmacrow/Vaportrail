/**
 * IFS Client Search and Indexing
 *
 * This API wraps the public methods exposed by SearchApplet,
 * a Lucene-powered, general purpose search and indexing component.
 *
 *
******************************************************************************/ 

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

// search namespace wraps the lucene applet
var search = {
	
	applet: null,
	onready: function(){},
	
	///
	/// Load a Lucene index from an IFS Filelist
	///
	loadIndex: function(id, capservice, listCap, cb){
		var ramdir = {}
		
		capservice.getfilelist(listCap, {onResponse: function(R){
			
			var list = R.data
			
			if(!list)
			return cb(false)
			
			var nfiles = list.length()
		
			if(!nfiles)
			return cb(false)
				
			function file_loaded(name, data){
				ramdir[name] = data
				if(--nfiles == 0){
					console.log('Loading index: ', ramdir)
					var ret = search.applet.loadIndex(id, ramdir) 
					cb(ret, id)
				}
			}
		
			for(var i = 0; i < list.length(); i++){
				capservice.getfile(list.file(i).ptr(),
					{onResponse: eval('(function(res){file_loaded("'
					+list.file(i).meta()['name']+'",res.data.val)})')})
			}
		
		}})
		
		return true
	},
	

	///
	/// Export a Lucene index to an IFS Filelist
	///
	exportIndex: function(id, capservice, cb){
	    
	    console.log('exportIndex: top');
	
		var dir = new ifs.objects.CapList()
		var ramdir = search.applet.exportIndex(id)
		
		console.log('Exporting index: ', ramdir)
		
		if(!ramdir){
			cb(null)
			return false
		}
		
		var nfiles = Object.keys(ramdir).length
		
		if(!nfiles){
			cb(null)
			return false
		}
		
		function file_stored(name, cap){
		
		    if(cap){
			    var ent = dir.add(cap)
			    ent.meta()['name'] = name
			}else{
			    console.log('INDEX PUT FAILED');
			}
			
			if(--nfiles == 0){
				capservice.putfilelist(dir, {onResponse: function(pfres){
					cb(pfres.data, dir)
				}})
			}
		}
		
		for(var file in ramdir){
			capservice.putfile( ramdir[file], {onResponse: 
				eval('(function(res){file_stored("'+file+'",res.data)})')
			})
		}
		
		return true
	},
	
	/// Create a new index with given id (cannot exist)
	createIndex: function(id){
		return search.applet.createIndex(id)
	},
	
	/// Open an existing index, optionally (re)create it.
	openIndex: function(id, bCreate){
		return search.applet.openIndex(id, bCreate)
	},
	
	/// Close an open index
	closeIndex: function(id){
		return search.applet.closeIndex(id)
	},
	
	/// Optimize an open index (after adding all documents.)
	optimizeIndex: function(id){
		return search.applet.optimizeIndex(id)
	},
	
	/// Add a document to an open index
	addDocument: function(id, doc){
		return search.applet.addDocument(id, 
			doc.stored || {}, doc.indexed || {}, doc.interned || {})
	},
	
	/// Update a document identified by field = val in an open index
	updateDocument: function(id, field, val, doc){
		return search.applet.updateDocument(id, field, val, 
			doc.stored || {}, doc.indexed || {}, doc.interned || {})
	},
	
	/// Delete a document identified by field = val in an open index
	deleteDocument: function(id, field, val){
		return search.applet.deleteDocument(id, field, val)
	},
	
	/// Search with [query] over field [field] in a closed index. Query
	/// supports complete Lucene query syntax.
	/// Note: Lucene supports concurrent reading and writing but this
	/// functionality is potentially shaky due to certain patches 
	/// made to Lucene's core so that it would run under the 
	/// security manager imposed on an unsigned applet.
	search: function(id, field, query){
		return search.applet.search(id, field, query)
	}
}

function search_start_callback(){
	search.applet = document.getElementById('SearchApplet')
	search.onready()
}
		
