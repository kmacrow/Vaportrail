/**
 org/ubc/nss/Index.java
 
 This class represents an "index", which can be opened, appended to, closed
 and searched. 
 
**/

package org.ubc.nss;


import java.util.ArrayList;
import java.util.Set;
import java.util.HashSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.lucene.util.Version;
import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.analysis.standard.StandardAnalyzer;
import org.apache.lucene.document.Document;
import org.apache.lucene.store.Directory;
import org.apache.lucene.store.RAMDirectory;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.index.IndexWriterConfig.OpenMode;
import org.apache.lucene.index.Term;

//import org.apache.lucene.util.BytesRef;
import org.apache.lucene.queryParser.QueryParser;
import org.apache.lucene.search.IndexSearcher;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.ScoreDoc;
import org.apache.lucene.search.TopDocs;
//import org.apache.lucene.search.highlight.QueryTermExtractor;
//import org.apache.lucene.search.highlight.WeightedTerm;

import java.io.IOException;
import org.apache.lucene.index.CorruptIndexException;
import org.apache.lucene.queryParser.ParseException;
import org.apache.lucene.store.LockObtainFailedException;

public class Index {

	///
	public class SearchResult {
		public Set<String> suggestions;
		public ArrayList<Document> results;
		
		public SearchResult(){
			suggestions = new HashSet<String>();
			results = new ArrayList<Document>();
		}
	}
	///

	private RAMDirectory dir;
	private Analyzer analyzer;
	private IndexWriter writer;
	private boolean isOpen;

	public Index(){
		dir = new RAMDirectory();
		initialize();
	}
	
	public Index(RAMDirectory dir){
		this.dir = dir;
		initialize(); 
	}
	
	private void initialize(){
		analyzer = new StandardAnalyzer(Version.LUCENE_33);  
		isOpen = false;	
	}
	
	public void open(boolean create){
		
		//System.out.println("Index.java: open()");
		
		IndexWriterConfig config;
		
		config = new IndexWriterConfig(Version.LUCENE_33, analyzer);
		
		//System.out.println("Index.java: new config");
		
		if(dir == null){
			System.out.println("Index.java: dir is null");
		}
		
		if(create)
			config.setOpenMode(OpenMode.CREATE);
	      	else
	      		config.setOpenMode(OpenMode.CREATE_OR_APPEND);
	      	
	      	try{	
	      		writer = new IndexWriter(dir, config);
			isOpen = true;
		}catch(LockObtainFailedException lfe){
			System.out.println("Index.java: " + lfe.getMessage()); 
		}catch(CorruptIndexException cie){
			System.out.println("Index.java: " + cie.getMessage());
		}catch(IOException ioe){
			System.out.println("Index.java: " + ioe.getMessage());
		}catch(Exception e){
			System.out.println("Index.java: " + e.getMessage());
		}
		
		
	}
	
	public void close(){
		try{
			writer.close();
			isOpen = false;
		}catch(Exception e){}
	}
	
	public boolean isOpen(){
		return isOpen;
	}
	
	public RAMDirectory getDirectory(){
		return dir;
	}
	
	public boolean add(Document doc){
		if(isOpen()){
			try{
				writer.addDocument(doc);
				return true;
			}catch(Exception e){
				return false;
			}
		}
		return false;
	}
	
	public boolean update(String field, String value, Document doc){
		if(isOpen()){
			try{
				writer.updateDocument(new Term(field, value), doc);
				return true;
			}catch(Exception e){
				return false;
			}
		}
		return false;
	}
	
	public boolean delete(String field, String value){
		if(isOpen()){
			try{
				writer.deleteDocuments(new Term(field, value));
				return true;
			}catch(Exception e){
				return false;
			}
		}else{
			return false;
		}
	}
	
	public void optimize(){
		if(isOpen()){
			// for balling out of control
			try{
				writer.optimize();
			}catch(Exception e){}
		}
	}
	
	public SearchResult search(String defaultField, String strQuery){
		
		Query query;
		QueryParser parser;
		IndexSearcher searcher;
		TopDocs results;
		ScoreDoc[] hits;
		ArrayList<String> queryTerms;
		String[] docTerms;
		SearchResult result;
		
		if(isOpen()){
			return null;
		}
		
		result = new SearchResult();
		
		parser = new QueryParser(Version.LUCENE_33, defaultField, analyzer);
		
		try{
			query = parser.parse(strQuery);
		}catch(ParseException pe){
			return result;
		}
		
		try{
	      		searcher = new IndexSearcher(dir);
	      	}catch(Exception e){
	      		return result;
	      	}
		
		// extract term words from the query
		Matcher matcher = Pattern.compile("[a-zA-Z0-9]+").matcher(strQuery);
		queryTerms = new ArrayList<String>();
	
		while(matcher.find()){
			queryTerms.add(matcher.group().toLowerCase());
		}
			

		try{
			results = searcher.search(query, 100);
		}catch(IOException e){
			return result;
		}
		
		hits = results.scoreDocs;
		
		boolean enoughSuggestions = false;
			
		for(ScoreDoc hit : hits){
			
			try{
				result.results.add( searcher.doc(hit.doc) );
				// extract "suggestions"
				docTerms = searcher.getIndexReader().getTermFreqVector(hit.doc, defaultField).getTerms();
			}catch(Exception e){
				return result;
			}
			
			// for each word in the query
			for(String qt : queryTerms){
				
				if(enoughSuggestions)
					break;
				
				// for each important word in the document text	
				for(String dt : docTerms){
				
					//String dts = dt.utf8ToString(); 
					
					// if the query word is a case insensitive prefix of the document word 
					if(dt.toLowerCase().startsWith(qt) && dt.length() > qt.length()){
						result.suggestions.add(dt);
						if(result.suggestions.size() >= 10){
							enoughSuggestions = true;
							break; 
						}
					}
				}
			}
			
			
		} // for each document
		
		try{
			searcher.close();
		}catch(Exception e){
			return result;
		}
		
		return result;
	}
	
	

}

