package org.ifs;

import org.json.*;
import java.util.ArrayList;
import org.ifs.Capability;
import org.ifs.FileList;

public class Test{

	private static final String FileList_00 = "[{\"bmFtZQ==\":\"YnJpYXIyQGh0dHA6Ly9jb2xsaW5zLmNzLnViYy5jYTo4MDgw\",\"dHlwZQ==\":\"bnM=\"},[[\"T1dORVIseyJkbnNyZWYiOiIiLCJpc3N1ZWQiOjEzMDk1MDExMTgsInJlZiI6IlBUUl80ZjczZGE5NTQ0ZWY0MGFiOGY3YmNhNDUzMjFiYTk0NyIsInJvb3QiOiJMSVNUX01ENV9mMWNiN2JmYmI5MTA0NDkzYTU5M2JiNDdkZmIzNTM4MiIsInVzZXIiOiJicmlhcjIifSxrMTo5Yzc2M2ExMDlmOGY1YTQxODA2OWQ0OTk0OWU4ZDM0Yg==\",{\"dHlwZQ==\":\"c3VibnM=\"}],[\"T1dORVIseyJkbnNyZWYiOiIiLCJpc3N1ZWQiOjEzMDk1MDExMTgsInJlZiI6IlBUUl8zZmMxNWUyMDk4ZjQ0NWIzOTczYmNkNTgzMmNiMGJmOSIsInJvb3QiOiJMSVNUX01ENV9mMWNiN2JmYmI5MTA0NDkzYTU5M2JiNDdkZmIzNTM4MiIsInVzZXIiOiJicmlhcjIifSxrMTpkYmI2MWM4ZDdmNzcyZGJmOTY2NmQ3YzAzYzEwZTVhYg==\",{\"dHlwZQ==\":\"ZGF0YQ==\"}]]]";
	private static final String FileList_01 = "[{},[[\"T1dORVIseyJkbnNyZWYiOiIiLCJpc3N1ZWQiOjEzMDk5MzI0NzksInJlZiI6IkJMT0JfTUQ1XzRlZjc2MGIwNTA4YjhjOWI3YzdiYjIwMjY1ZmRiYTYwIiwidXNlciI6ImJyaWFyMiJ9LGsxOmRlNzA5MzA0NTZmOTUzZmNhMzg2Yzk3ODFlZDM4OTRm\",{}]]]";

	public static void main(String[] args){
	
		System.out.println("Testing org.ifs...");
	
		try{
		
			System.out.println("#################### TEST 1 ####################");
			
			FileList ff = new FileList(FileList_00);
			
			printFileList(ff);
			
			// Now the real test
			String packed = ff.pack();
			
			FileList ff2 = new FileList(packed);
			
			System.out.println("#################### TEST 2 ####################");
			
			printFileList(ff2);
		
			System.out.println("#################### TEST 3 ####################");
		
			FileList f01 = new FileList(FileList_01);
			printFileList(f01);
			
		
			System.out.println("Done.");
		
		}catch(Exception e){
			System.out.println("Exception: " + e.getMessage());
		}
		
	
	}
	
	public static void printFileList(FileList f) throws JSONException{
		
		System.out.println("============= FileList ================");
		printMetaData(f.getMeta());
		
		ArrayList<FileList.Entry> entries = f.getFiles();
		for(int i = 0; i < entries.size(); i++){
			FileList.Entry e = entries.get(i);
		
			System.out.println("---------------- Entry " + (i + 1) + " -----------------");	
			printMetaData(e.getMeta());
			System.out.println("------");
			printCapability(e.getCap());
		
		}
		
	}
	
	public static void printMetaData(JSONObject m) throws JSONException{
		System.out.println(m.toString(8)); // pretty print w/ indenting
	}
	
	public static void printCapability(Capability c) throws JSONException{
		String[] types = {"GET","OWNER","USER","UNKNOWN"};
		
		Capability.Ref r = c.getRef();
		System.out.println("Type: " + types[c.getType()]);
		System.out.println("Ref: " + r.pack());
		System.out.print("Opts: ");
		printMetaData(c.getOpts());
		System.out.println("Str: " + c.pack());
		
	}
	


}

