/**
  org/ubc/nss/SearchApplet.java
  
  This applet is the primary interface used by javascript to build and search
  Lucene indices. 

**/

package org.ubc.nss;

import java.applet.*;

// LiveConnect for Java <--> Javascript interop
import netscape.javascript.*;

import java.util.Map;
import java.util.HashMap;


import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;
import org.apache.lucene.document.Fieldable;
import org.apache.lucene.store.Directory;
import org.apache.lucene.store.RAMDirectory;
import org.apache.lucene.store.IndexOutput;


public class SearchApplet extends Applet{

	private Map<String, Index> indices;
	private JSObject window;
	private static final String INFO_STRING = "org.ubc.nss.SearchApplet - Client-"+
							"side Search and Indexing";
						
	///////////////////////////////////////////////////////////////////////
	/// Startup & Tear-down
	///////////////////////////////////////////////////////////////////////
	
	public String getAppletInfo(){
		return INFO_STRING;
	}

	public void init(){
		indices = new HashMap<String, Index>();
		window = JSObject.getWindow(this);
		log("Initialized.");
	}
	
	public void start(){
	
		String cb = getParameter("start_callback");
		if(cb != null)
			window.call(cb, null);
		
		log("Started.");
		
		//System.out.println("Create Index: " + createIndex("test"));
		//System.out.println("Open Index: " + openIndex("test", true));
	}
	
	public void stop(){
	
	}
	
	public void destroy(){
	
	}
	
	private void log(String msg){
		window.eval("console.log(\"SearchApplet: "+ msg +"\")");
	}
	
	/// Workaround for JSObject not exposing a key list
	private String[] objectKeys(JSObject o){
		String str = (String)window.call("Object$keys", new Object[]{o});
		if(str == null || str.trim().length() == 0)
			return new String[]{};
		if(str.indexOf(',') == -1)
			return new String[]{str};
		return str.split(",");
		
	}
	
	// Workaround for JSObject not defining a constructor
	private JSObject newJSObject(){
		return (JSObject)window.call("Object$new", null);
	}
	
	///////////////////////////////////////////////////////////////////////
	/// Various
	///////////////////////////////////////////////////////////////////////
	/*
	public JSObject objectTest(String[] keys, String[] values){
		JSObject o = newJSObject();
		for(int i = 0; i < keys.length; i++)
			o.setMember(keys[i], values[i]);
		 
		 return o;
	}
	
	public JSObject arrayTest(String[] elems){
		JSObject o = newJSObject();
		for(int i = 0; i < elems.length; i++)
			o.setSlot(i, elems[i]);
		return o;
	}
	
	public JSObject echoTest(JSObject o){
		JSObject ob = newJSObject();
		return ob;
	}
	*/
	///////////////////////////////////////////////////////////////////////
	/// Utility
	///////////////////////////////////////////////////////////////////////
	
	// Build a RAMDirectory key/value store from a native JS object
	// values are stored base64 encoded to avoid utf8 string issues.
	private RAMDirectory parseRAMDirectory(JSObject obj){
		
		RAMDirectory dir = new RAMDirectory();
		String[] files = objectKeys(obj);
		IndexOutput stream;
		
		if(files == null)
			return dir;
			
		for(String file : files){
			try{
				String data = (String)obj.getMember(file);
				byte[] bytes = Base64.decode( data );
				stream = dir.createOutput(file);
				stream.setLength(bytes.length);
				stream.writeBytes(bytes, bytes.length);
				stream.flush();
				stream.close();
				
			}catch(Exception e){
				return dir;
			}
		}
				
		return dir;
	}
	
	// Pack a RAMDirectory key/value store into a native JS Object
	private JSObject packRAMDirectory(RAMDirectory dir){
	
		JSObject obj = newJSObject();
		String[] files = dir.listAll();
		
		for(String file : files){
			try{
				long sz = dir.fileLength(file);
				byte[] bytes = new byte[(int)sz];
				dir.openInput(file).readBytes(bytes, 0, (int)sz);
				obj.setMember( file, Base64.encodeBytes( bytes ) );	
			}catch(Exception e){
				return obj;
			}
		}
		
		return obj;
	
	}
	
	// Build a Lucene Document from native JS Objects.
	private Document parseDocument(JSObject stored, JSObject indexed, JSObject storedAndIndexed){
		
		Document doc = new Document();
		String[] storedFieldNames = objectKeys(stored);
		String[] indexedFieldNames = objectKeys(indexed);
		String[] storedAndIndexedFieldNames = objectKeys(storedAndIndexed);
		
		if(storedFieldNames != null){
			for(String field : storedFieldNames){
				doc.add(new Field(field, (String)stored.getMember(field), 
						Field.Store.YES, Field.Index.NOT_ANALYZED, 
						Field.TermVector.NO));
			}
		}
		
		if(indexedFieldNames != null){
			for(String field : indexedFieldNames){
				doc.add(new Field(field, (String)indexed.getMember(field), 
					Field.Store.NO, Field.Index.ANALYZED, Field.TermVector.YES));
			}
		}
		
		if(storedAndIndexedFieldNames != null){
			for(String field : storedAndIndexedFieldNames){
				doc.add(new Field(field, (String)storedAndIndexed.getMember(field), 
						Field.Store.YES, Field.Index.ANALYZED, 
						Field.TermVector.YES));
			}
		}
			
		return doc;
	}
	
	// Pack a Lucene Document as a native JS Object
	private JSObject packDocument(Document doc){
	
		JSObject obj;
		obj = newJSObject();
		
		for(Fieldable field : doc.getFields()){
			if(field.isStored())
				obj.setMember(field.name(), field.stringValue());
		}
		
		return obj;
	
	}
	
	///////////////////////////////////////////////////////////////////////
	/// Indexing
	///////////////////////////////////////////////////////////////////////
	private Index getIndex(String indexId){
		return indices.get(indexId);
	}
	
	public boolean createIndex(String indexId){
		if(indices.containsKey(indexId)){
			return false;
		}else{
			indices.put(indexId, new Index());
			return true;
		}
	}
	
	public boolean loadIndex(String indexId, JSObject ramDir){
		if(indices.containsKey(indexId)){
			return false;
		}else{
			RAMDirectory dir = parseRAMDirectory(ramDir);
			Index dex = new Index(dir);
			indices.put(indexId, dex);
			return true; 
		} 
	}
	
	public JSObject exportIndex(String indexId){
		try{
			return packRAMDirectory( getIndex(indexId).getDirectory() );
		}catch(Exception e){
			return null;
		}
	}
	
	public boolean openIndex(String indexId){
		return openIndex(indexId, true);
	}
	
	public boolean openIndex(String indexId, boolean create){
			
		try{	
			Index dex = getIndex(indexId);
			
			if(dex.isOpen()){
				return true;
			}else{
				dex.open(create);
				return true;
			}
				
		}catch(Exception e){
			return false;
		}
		
	}
	
	public void closeIndex(String indexId){
		try{	
			Index dex = getIndex(indexId);
			if(dex.isOpen())
				dex.close();
				
		}catch(Exception e){}
	}
	
	public void optimizeIndex(String indexId){
		try{
			getIndex(indexId).optimize();
		}catch(Exception e){}
	}
	
	public boolean addDocument(String indexId, JSObject stored, JSObject indexed, JSObject both){
		try{
			Index dex = getIndex(indexId);
			if(!dex.isOpen())
				return false;
			
			dex.add( parseDocument(stored, indexed, both) );
			return true;
		}catch(Exception e){
			return false;
		}
	}
	
	public boolean deleteDocument(String indexId, String key, String val){
		try{
			Index dex = getIndex(indexId);
			dex.delete(key, val);
			return true;
			
		}catch(Exception e){
			return false;
		}
	}
	
	public boolean updateDocument(String indexId, String key, String val, 
					JSObject stored, JSObject indexed, JSObject both){
		try{
			Index dex = getIndex(indexId);
			dex.update(key, val, parseDocument(stored, indexed, both) );
			return true;
			
		}catch(Exception e){
			return false;
		}
	} 
	
	///////////////////////////////////////////////////////////////////////
	/// Search
	///////////////////////////////////////////////////////////////////////	
	public JSObject search(String indexId, String defaultField, String query){
		JSObject result = newJSObject();
		
		result.setMember("results", null);
		result.setMember("suggest", null);
		
		try{
			Index dex = getIndex(indexId);
			Index.SearchResult res = dex.search(defaultField, query);
			
			JSObject suggest = newJSObject();
			
			// copy the set into an array
			Object[] suggestions = res.suggestions.toArray();
			
			for(int i = 0; i < suggestions.length; i++)
				suggest.setSlot(i, (String)suggestions[i]); 
			
			suggest.setMember("length", suggestions.length);
			
			JSObject results = newJSObject();
			for(int i = 0; i < res.results.size(); i++)
				results.setSlot(i, packDocument(res.results.get(i)));
			
			results.setMember("length", res.results.size());
			
			result.setMember("suggest", suggest);
			result.setMember("results", results);
			
			return result;
			
		}catch(Exception e){
			System.out.println("Search: " + e.getMessage());
			e.printStackTrace(System.out);
			return result;
		}
	} 
	
	

}

