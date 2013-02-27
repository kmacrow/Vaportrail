package org.ifs.net;

import org.ifs.CapServer;
import org.ifs.Capability;
import org.ifs.FileList;
import org.json.JSONObject;
import org.json.JSONArray;

// TODO: Fix * imports
import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;

import java.util.Date;
import java.util.Queue;
import java.util.Set;
import java.util.HashSet;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.lucene.util.BytesRef;
import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.analysis.standard.StandardAnalyzer;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Fieldable;
import org.apache.lucene.queryParser.QueryParser;
import org.apache.lucene.search.IndexSearcher;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.ScoreDoc;
import org.apache.lucene.search.TopDocs;
import org.apache.lucene.search.highlight.QueryTermExtractor;
import org.apache.lucene.search.highlight.WeightedTerm;
import org.apache.lucene.store.FSDirectory;
import org.apache.lucene.util.Version;

public class SearchServlet extends HttpServlet {

	private String cookieName;
	private String mountPoint;
	private String indexBasePath;
	
	public void init(){
	
		// load config
		cookieName = getServletContext().getInitParameter("capsrv_session_cookie");
		mountPoint = getServletContext().getInitParameter("capsrv_mount_point");
		indexBasePath = getServletContext().getInitParameter("index_base_path");	
		
	}

	public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		
		CapServer capsrv = null;
		IndexSearcher searcher;
		Analyzer analyzer;
		QueryParser parser;
		Query query;
		TopDocs results;
		ScoreDoc[] hits;
		WeightedTerm[] weightedTerms;
		ArrayList<String> queryTerms;
		BytesRef[] docTerms;
		
		JSONObject output;
		JSONArray resultset;
		
		String strQuery;
		String indexId;
		String indexPath;
	
		
		// find the capsess cookie
		for(Cookie c : request.getCookies()){
			if(c.getName().equals(cookieName))
				capsrv = new CapServer(cookieName, c.getValue(), mountPoint);
		}
		
		if(capsrv == null){
			response.sendError(500, "No Session Detected.");
			return;
		}
		
		if(!capsrv.isLoggedIn()){
			response.sendError(500, "Invalid Session.");
			return;
		}
		
		if(request.getParameter("q") == null || request.getParameter("q").trim().length() == 0){
			response.sendError(500, "No query specified.");
			return;
		}else{
			strQuery = request.getParameter("q").trim();
		}
		
		if(request.getParameter("index") == null){
			indexId = "default";
		}else{
			indexId = request.getParameter("index");
		}
		
		indexPath = indexBasePath + "/" + capsrv.getUserId() + "/" + indexId;
		
		// index has to exist
		if(!new File(indexPath).exists()){
			response.sendError(500, "Index does not exist.");
			return;
		}
		
		try{
			Date start = new Date();
		
			searcher = new IndexSearcher(FSDirectory.open(new File(indexPath)));
			analyzer = new StandardAnalyzer(Version.LUCENE_40);
			
			parser = new QueryParser(Version.LUCENE_40, "_blob_", analyzer);
			query = parser.parse(strQuery);
			
			// get the terms 
			Matcher matcher = Pattern.compile("[a-zA-Z0-9]+").matcher(strQuery);
			queryTerms = new ArrayList<String>();
			
			while(matcher.find()){
				queryTerms.add(matcher.group().toLowerCase());
			}
					
			// TODO: make num results variable
			results = searcher.search(query, 100);
			hits = results.scoreDocs;
			
			resultset = new JSONArray();
			Set<String> suggestions = new HashSet<String>(); 
			
			for(ScoreDoc hit : hits){
		
				JSONObject result = new JSONObject();
				
				Document doc = searcher.doc(hit.doc);
				result.put("score", hit.score);
				
				// extract "suggestions"
				if(suggestions.size() < 10){
					docTerms = searcher.getIndexReader().getTermFreqVector(hit.doc, "_blob_").getTerms();
				
					for(String qt : queryTerms){
						for(BytesRef dt : docTerms){
							String dts = dt.utf8ToString(); 
							if(dts.toLowerCase().startsWith(qt) && dts.length() > qt.length()){
								suggestions.add(dts);
								if(suggestions.size() >= 10)
									break; 
							}
						}
					}
				}
				
				//result.put("suggest", suggestions);
				
				// extract stored document fields
				for(Fieldable field : doc.getFields()){
					if(field.isStored())
						result.put(field.name(), field.stringValue());
				}
				
				resultset.put(result); 
			}
			
			searcher.close();
			
			output = new JSONObject();
			output.put("latency", new Date().getTime() - start.getTime());
			output.put("numhits", hits.length);
			output.put("status", true);
			output.put("results", resultset);
			output.put("suggest", new JSONArray(suggestions));
			
			response.getWriter().println(output.toString());
			
		
		}catch(Exception e){
			response.sendError(500, e.getMessage());
		}
		
	}
	


}

