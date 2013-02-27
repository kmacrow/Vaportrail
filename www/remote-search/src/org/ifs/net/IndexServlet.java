package org.ifs.net;

import org.ifs.CapServer;
import org.ifs.Capability;
import org.ifs.FileList;
import org.json.JSONObject;

// TODO: Fix * imports
import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;
import java.net.URLEncoder;

import java.util.Date;
import java.util.Queue;
import java.util.LinkedList;
import java.util.Iterator;
import java.text.SimpleDateFormat;
import java.text.ParseException;

import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.analysis.standard.StandardAnalyzer;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;
import org.apache.lucene.document.NumericField;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig.OpenMode;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.index.Term;
import org.apache.lucene.store.Directory;
import org.apache.lucene.store.FSDirectory;
import org.apache.lucene.util.Version;

public class IndexServlet extends HttpServlet {

	private String cookieName;
	private String mountPoint;
	private String indexBasePath;
	private SimpleDateFormat jsDateFormat;
	
	public void init(){
		
		// load config
		cookieName = getServletContext().getInitParameter("capsrv_session_cookie");
		mountPoint = getServletContext().getInitParameter("capsrv_mount_point");
		indexBasePath = getServletContext().getInitParameter("index_base_path");
		
		jsDateFormat = new SimpleDateFormat("EEE MMM dd yyyy HH:mm:ss 'GMT'Z (zzz)"); 
		
	}	
	
	public void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		
		CapServer capsrv = null;
		FileList list;
		Capability root;

		
		boolean rebuild;
		String indexPath;
		String indexId;
		Directory indexDir;
		Analyzer analyzer;
		IndexWriterConfig iwc;
		IndexWriter writer;
	
		
		// find the capsess cookie
		for(Cookie c : request.getCookies()){
			if(c.getName().equals(cookieName)){
				capsrv = new CapServer(cookieName, c.getValue(), mountPoint);
			}
		}
		
		
		if(capsrv == null){
			response.sendError(500, "No Session Detected.");
			return;
		}
		
		if(!capsrv.isLoggedIn()){
			response.sendError(500, "Invalid Session.");
			return;
		}
		
		
		try{
			root = new Capability( request.getParameter("root") );
		}catch(Exception e){
			response.sendError(500, "Malformed root capability.");
			return;	
		}
		
		indexId = request.getParameter("index");
		if(indexId == null)
			indexId = "default";
		
		if(request.getParameter("mode") != null){
			rebuild = request.getParameter("mode").equals("rebuild");
		}else{
			rebuild = true;
		}
		
		try{
			indexPath = indexBasePath + "/" + capsrv.getUserId() + "/" + indexId; 
			indexDir = FSDirectory.open(new File(indexPath));
			
			list = capsrv.getFileList(root);
			
			if(list == null){
				response.sendError(500, "Failed to retrieve root list.");
				return;
			}		
		
			analyzer = new StandardAnalyzer(Version.LUCENE_40);
	      		iwc = new IndexWriterConfig(Version.LUCENE_40, analyzer);
		
			if(rebuild){
				iwc.setOpenMode(OpenMode.CREATE);
	      		}else{
				iwc.setOpenMode(OpenMode.CREATE_OR_APPEND);
	      		}
		
			
			writer = new IndexWriter(indexDir, iwc);
		
		
			///
			// ... index stuff ...
			///
			Date start = new Date();
			
			int numDocs = indexFileList(capsrv, writer, list, true);
			
			writer.close();
			
			JSONObject output = new JSONObject();
			output.put("latency", new Date().getTime() - start.getTime());
			output.put("numdocs", numDocs);
			output.put("status", true);
			
			response.getWriter().println(output.toString());
			
		}catch(Exception e){
			getServletContext().log("IFS [IndexServlet] Exception:", e);
			response.sendError(500, e.getMessage());
			return;
		}
		
	}
	
	
	public int indexFileList(CapServer capsrv, IndexWriter writer, FileList list, boolean recur) throws org.json.JSONException, java.io.IOException{
	
		int numDocs = 0;
		int numSubDocs = 0;
	
		if(list == null)
		return 0;
		
		for(FileList.Entry e : list.getFiles()){
			
			Document doc;
			
			Capability cap = e.getCap();
			JSONObject meta = e.getMeta();
			String blob = null;
			
			switch(cap.getRef().getType()){
				case Capability.REF_PTR:
					Capability ptr = capsrv.getPtr(cap);
					
					if(ptr == null)
					continue;
					
					switch(ptr.getRef().getType()){
						case Capability.REF_LIST:
							if(recur){
								if( (numSubDocs = indexFileList(capsrv, writer, 
											capsrv.getFileList(cap), recur)) > 0)
									numDocs += numSubDocs;
								continue;
							}		
						break;
						case Capability.REF_BLOB:
							blob = capsrv.getFile(ptr);
						break;
						default:
							// ptr to ptr.. ERROR ERROR
							continue;
					}
				break;
				case Capability.REF_LIST:
					if(recur){
						if( (numSubDocs = indexFileList(capsrv, writer, 
									capsrv.getFileList(cap), recur)) > 0)
							numDocs += numSubDocs;
						continue;
					}
				break;
				case Capability.REF_BLOB:
					blob = capsrv.getFile(cap);
				break;
			}
		

			// nothing we can do with this
			if(blob == null && meta.length() == 0)
				continue;
			
			
			// 
			doc = new Document();
		
			// parse and index meta data for this entry
			Iterator it = meta.keys();
			
			while(it.hasNext()){
				String key = (String)it.next();
				
				String strValue = meta.optString(key).trim();
				if(strValue.length() == 0)
					continue;
				if(isInteger(strValue)){
					try{
						doc.add(new NumericField(key, Field.Store.YES, true).setIntValue(Integer.parseInt(strValue)));
					}catch(Exception ex){}
					
				}else if(isFloat(strValue)){
					try{
						doc.add(new NumericField(key, Field.Store.YES, true).setDoubleValue(Double.parseDouble(strValue)));
					}catch(Exception ex){}
				}else{
					if(isValidJSDate(strValue)){
						Date date = parseJSDate(strValue);
						if(date != null){
							doc.add(new NumericField(key, Field.Store.NO, true).setLongValue(date.getTime()));
							continue;
						}
					}
				
					if(strValue.indexOf(' ') != -1){
						// treat as normal text
						doc.add(new Field(key, strValue, Field.Store.NO, Field.Index.ANALYZED, Field.TermVector.NO));
					}else{
						// treat as a special token
						doc.add(new Field(key, strValue, Field.Store.YES, Field.Index.NOT_ANALYZED, Field.TermVector.NO)); 
					}
				}
				
			}
		
			
			// TODO: 	
			if(blob != null)
				doc.add( new Field("_blob_", blob, Field.Store.NO, Field.Index.ANALYZED, Field.TermVector.YES) );
		
			// the index will map onto the capability for the blob
			doc.add( new Field("_cap_", cap.pack(), Field.Store.YES, Field.Index.NO, Field.TermVector.NO) );
			
			// using the address as a unique identifier of this blob (useful for intersecting results)
			doc.add( new Field("_addr_", cap.getRef().getAddress(), Field.Store.YES, Field.Index.NO, Field.TermVector.NO) );
			
			
			// add doc to the index
			try{
				writer.addDocument(doc);
				numDocs++;
			}catch(Exception ex){ // potentially corrupt index
				return numDocs;
			}
		}
		
		return numDocs;
	
	} // indexFileList
	
	
	private static boolean isInteger(String str){
		return str.matches("\\-?\\d+");
	}
	
	private static boolean isFloat(String str){
		return str.matches("\\-?\\d+\\.\\d+");
	}
	
	private boolean isValidJSDate(String str){
		return str.length() == jsDateFormat.toPattern().length();
	}
	 
	private Date parseJSDate(String str){
		try{
			return jsDateFormat.parse(str);
		}catch(ParseException pe){
			return null;
		}	
	}

}

