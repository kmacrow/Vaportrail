package org.ifs;

import java.io.IOException;
import org.json.*;
import org.ifs.Base64;
import java.util.ArrayList;

public class FileList {

	public class Entry{
	
		private JSONObject meta;
		private Capability cap;
		
		public Entry(Capability cap, JSONObject meta){
			this.meta = meta;
			this.cap = cap;
		}
			
		public JSONObject getMeta(){
			return this.meta;
		}
		
		public Capability getCap(){
			return this.cap;
		}
		

	} // class Entry

	private ArrayList<Entry> files;
	private JSONObject meta;
	
	public FileList(){
		this.files = new ArrayList<Entry>();
		this.meta = new JSONObject();
	}
	
	public FileList(ArrayList<Entry> files, JSONObject meta){
		this.files = files;
		this.meta = meta;
		
		// safety first
		if(this.files == null)
			this.files = new ArrayList<Entry>();
		if(this.meta == null)
			this.meta = new JSONObject();
	}
	
	public FileList(String list) throws JSONException, IOException {
		JSONArray arr, encEntries;
		this.files = new ArrayList<Entry>();
		
		arr = new JSONArray(list);
		
		this.meta = FileList.parseMetaData(arr.getJSONObject(0));
		
		encEntries = arr.getJSONArray(1);	
		
		for(int i = 0; i < encEntries.length(); i++){
			JSONArray ent;
			
			ent = encEntries.getJSONArray(i);
			
			this.files.add( new Entry(new Capability(new String(Base64.decode(ent.getString(0)))), 
						FileList.parseMetaData(ent.getJSONObject(1)) ) ); 
		} 
	}
	
	public static JSONObject parseMetaData(JSONObject raw) throws JSONException, IOException {
		JSONObject meta = new JSONObject();
		
		String[] fields = JSONObject.getNames(raw);
		
		if(fields == null)
		return meta;
		
		for(int i = 0; i < fields.length; i++){
			String strValue;
			Object rawValue = raw.get(fields[i]);
			
			if(rawValue instanceof String)
				strValue = new String(Base64.decode( (String)rawValue));
			else
				strValue = rawValue.toString();
				
			meta.put(new String(Base64.decode(fields[i])), strValue);
		}
		
		return meta;
	}
	
	public static JSONObject encodeMetaData(JSONObject meta) throws JSONException {
	
		JSONObject encoded = new JSONObject();
		String[] fields = JSONObject.getNames(meta);
		for(int i = 0; i < fields.length; i++){			
			encoded.put( Base64.encodeBytes(fields[i].getBytes()), Base64.encodeBytes(meta.get(fields[i]).toString().getBytes()) );
		}	
		return encoded;
	}

	public ArrayList<Entry> getFiles(){
		return this.files;
	}
	
	public JSONObject getMeta(){
		return this.meta;
	}
	
	public void add(Entry e){
		this.files.add(e);
	}
	
	public String pack() throws JSONException {
		JSONArray packed = new JSONArray();
		packed.put( FileList.encodeMetaData(this.meta) );
		
		JSONArray encEntries = new JSONArray();
		for(int i = 0; i < files.size(); i++){
			Entry e = files.get(i);
			JSONArray ea = new JSONArray();
			ea.put( Base64.encodeBytes(e.getCap().pack().getBytes()) );
			ea.put( FileList.encodeMetaData(e.getMeta()));
			encEntries.put(ea);
		}
		
		packed.put(encEntries);
		return packed.toString();
		
	}

}
