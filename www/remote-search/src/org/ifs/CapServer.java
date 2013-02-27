package org.ifs;

import org.json.*;
import org.ifs.Base64;
import org.ifs.FileList;
import org.ifs.Capability;

import java.util.Scanner;
import java.io.InputStream;
import java.io.OutputStreamWriter;
import java.net.URL;
import java.net.URLEncoder;
import java.net.HttpURLConnection;



public class CapServer {

	private static final String CLIENT_VERSION = "1.0.0";
	private String appUrl; 
	private String sessCookie;
	private String userId;
	private String hostName;

	public CapServer(String sessKey, String sessContent, String mountPoint){
		
		try{
			String[] sessComp = sessContent.split(",", 0);
			String userid = new String(Base64.decode(sessComp[0]));
			String host = new String(Base64.decode(sessComp[2]));
		
			this.appUrl = host + mountPoint + Base64.encodeBytes( (userid + "@" + host).getBytes() );
			this.sessCookie = sessKey + "=\"" + sessContent + "\"; ifsuser=\""+ userid +"\"";
			this.userId = userid;
			this.hostName = host;
		
		}catch(Exception e){
			this.appUrl = "";
			this.sessCookie = "";
			this.userId = "";
			this.hostName = "";
		}
	}
	
	public String getUserId(){
		return this.userId;
	}
	
	public String getHostName(){
		return this.hostName;
	}
	
	private String doGETRequest(String url){
	
		try{	
			HttpURLConnection conn = (HttpURLConnection)new URL(url).openConnection();
			conn.setFollowRedirects(true);
			conn.setRequestMethod("GET");
			conn.setRequestProperty("Cookie", this.sessCookie);
			conn.setRequestProperty("User-Agent", "org.ifs.CapServer (" + CapServer.CLIENT_VERSION + ")");
		
			if(conn.getResponseCode() != HttpURLConnection.HTTP_OK)
			return null;
			
			return readStream(conn.getInputStream());	
			
		}catch(Exception e){
			return null;
		}
		
	}
	
	private String doPOSTRequest(String url, String data){
		
		try{
			HttpURLConnection conn = (HttpURLConnection)new URL(url).openConnection();
			conn.setFollowRedirects(true);
			conn.setRequestMethod("POST");
			conn.setRequestProperty("Cookie", this.sessCookie);
			conn.setRequestProperty("User-Agent", "org.ifs.CapServer (" + CapServer.CLIENT_VERSION + ")");
			conn.setDoOutput(true);
		
			OutputStreamWriter body = new OutputStreamWriter(conn.getOutputStream());
			
			body.write(data);
			body.flush();	
		
			if(conn.getResponseCode() != HttpURLConnection.HTTP_OK)
			return null;
			
			return readStream(conn.getInputStream());	
		
		
		}catch(Exception e){
			return null;
		}
	}

	private static String readStream(InputStream is){
		return new Scanner(is).useDelimiter("\\A").next();
	}
	
	private String POSTService(String service, String data){
		return doPOSTRequest(this.appUrl + service, data);
	}
	
	private String GETService(String service){
		return doGETRequest(this.appUrl + service);
	}


	public boolean isLoggedIn(){	
		try{
			String result = GETService("/is_logged_in/");
			
			JSONObject obj = new JSONObject(result);
			return obj.has("userid");
		
		}catch(Exception e){
			return false;
		}
	}
	
	public String getFile(Capability cap){
		try{
			return GETService("/getblob/" + URLEncoder.encode(cap.pack()));
		}catch(Exception e){
			return null;
		}
	}
	
	public FileList getFileList(Capability cap) throws org.json.JSONException, java.io.IOException {
		//try{
			String result = GETService("/getfilelist/" + URLEncoder.encode(cap.pack()));
			return new FileList(result);
			
		//}catch(Exception e){
		//	return null;
		//}
	}
	
	public JSONObject getJSON(Capability cap){
		try{
			String blob = getFile(cap);
			return new JSONObject(blob);
		}catch(Exception e){
			return null;
		}
	}
	
	public Capability getPtr(Capability ptr){
		try{
			String result = GETService("/getptr/" + URLEncoder.encode(ptr.pack()));	
			return new Capability(result);
			
		}catch(Exception e){
			return null;
		}
	}
	
	public Capability getNS(){
		try{
			String result = POSTService("/getns/","");
			return new Capability(result);
			
		}catch(Exception e){
			return null;
		}
	}
	

	public static void main(String[] args){
		// TODO: Test code.
	}

}


