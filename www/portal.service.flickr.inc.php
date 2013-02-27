<?php

require_once('lib/phpFlickr-3.1/phpFlickr.php');

// duplicated in auth.php
$api_key  = "dad024b7bfec1ce9757fe655a22d963a";
$api_secret = "4c7caf0f37f69fe4";



if(!isset($_GET['flickr_action']))
exit("No <tt>flickr_action</tt> specified.");

$flickr = new phpFlickr($api_key, $api_secret);

switch($_GET['flickr_action']){
	case 'auth':
		$_SESSION['phpFlickr_auth_token'] = null;
		$flickr->token = null;
		
		$flickr->auth(isset($_GET['flickr_perm'])?$_GET['flickr_perm']:'read');
		exit();
	break;
	
	case 'check_auth':
		exit(json_encode(isset($_SESSION['phpFlickr_auth_token'])));
	break;
	
	case 'auth_callback':
		exit('<html><head><script>window.opener.FlickrService_AuthComplete();self.close()</script></head></html>');
	break;
	
	case 'api':
		if(!isset($_GET['flickr_api']))
		exit("No <tt>flickr_api</tt> specified.");
		
		// transform flickr.module.function to module_function
		$pieces = explode(".", $_GET['flickr_api']);
		$api = implode("_", array_slice($pieces,1));
		
		//var_dump(json_decode($_GET['flickr_params'],true));
		
		$result = call_user_func_array( array($flickr, $api), isset($_GET['flickr_params'])?json_decode($_GET['flickr_params'],true):array() );
		
		exit(json_encode($result));
		 
	break;


}

?>
