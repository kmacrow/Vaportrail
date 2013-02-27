package org.ifs;

import org.json.*;


public class Capability {

	public static final int REF_BLOB = 0;
	public static final int REF_LIST = 1;
	public static final int REF_PTR = 2;
	public static final int REF_UNKNOWN = 3;

	public class Ref {
		
		private int type;
		private String addr;
		
		public Ref(int type, String addr){
			this.type = type;
			this.addr = addr;
		}
		
		public Ref(String refstr){
		
			int idx = refstr.indexOf('_');
			String strType = refstr.substring(0, idx);
			
			if(strType.equals("BLOB"))
				this.type = Capability.REF_BLOB;
			else if(strType.equals("LIST"))
				this.type = Capability.REF_LIST;
			else if(strType.equals("PTR"))
				this.type = Capability.REF_PTR;
			else
				this.type = Capability.REF_UNKNOWN;
			
			this.addr = refstr.substring(idx+1);
		}
		
		public int getType(){ return this.type; }
		public String getAddress(){return this.addr; }
		
		public String pack(){
			String s;
			switch(this.type){
				case Capability.REF_BLOB:
					s = "BLOB"; break;
				case Capability.REF_LIST:
					s = "LIST"; break;
				case Capability.REF_PTR:
					s = "PTR"; break;
				default:
					s = "BLOB";
			}
			
			s += "_" + this.addr;
			return s;
		}
		
	} // class Ref
	
	public static final int GET = 0;
	public static final int OWNER = 1;
	public static final int USER = 2;
	public static final int UNKNOWN = 3;
	
	private JSONObject opts;
	private Ref ref;
	private String str;
	private int type;
	
	public Capability(String str, JSONObject opts, Ref ref, int type){
		this.opts = opts;
		this.str = str;
		this.ref = ref;
		this.type = type;
	}
	
	public Capability(String capstr) throws JSONException {
		
		this.str = capstr;
		
		int lastComma = capstr.lastIndexOf(',');
		String payload = capstr.substring(0, lastComma);
		
		int firstComma = payload.indexOf(',');
		String strType = payload.substring(0, firstComma);
		
		if(strType.equals("GET"))
			this.type = Capability.GET;
		else if(strType.equals("OWNER"))
			this.type = Capability.OWNER;
		else if(strType.equals("USER"))
			this.type = Capability.USER;
		else
			this.type = Capability.UNKNOWN;
		
		this.opts = new JSONObject(payload.substring(firstComma+1));
		
		if(opts.has("ref"))
			this.ref = new Ref( opts.getString("ref") );
		else
			this.ref = new Ref(Capability.REF_UNKNOWN, "");
		
		
	}
	
	public String pack(){ return this.str; }
	public int getType(){ return this.type; }
	public Ref getRef(){ return this.ref; }
	public JSONObject getOpts(){ return this.opts; }
	

}

