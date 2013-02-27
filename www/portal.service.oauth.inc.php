<?php

/**
 * This is a light weight OAuth-proxy consumer.
 * It is meant to used from the client/javascript via AJAX
 * to authenticate with an OAuth provider and make API calls
 * for protected resources from that provider. 
 *
 * This proxy can maintain session state for an arbitratry number
 * of OAuth sessions, each identified by a unique service id which
 * is provided by the client on each request to this proxy.
 *
 * OAuth provider endpoints are configured by an .ini file in this
 * directory called oauth.ini. There should be one section per
 * service where each section is named by a unique service id. 
 * Within each service's section, there would be the following
 * key/values:
 *
 * auth = URL to auth endpoint
 * request = URL to request token endpoint 
 * access = URL to access token endpoint
 * api = URL to api endpoint
 * key = app consumer key
 * secret = app consumer secret
 *
**/

/* output json */
function echo_json($mixed){
	echo json_encode($mixed);
}

function exit_json($mixed){
	exit(json_encode($mixed));
}

// bootstrap session
session_start();

error_reporting(E_ALL);
ini_set('display_errors', '1');



if(!isset($_GET['oauth_service_id']))
exit("No <tt>oauth_service_id</tt> specified.");

$service_id = $_GET['oauth_service_id'];
$config = parse_ini_file("oauth.ini", true);

if(!isset($config[$service_id]))
exit("Unrecognized <tt>oauth_service_id</tt> specified.");

if(!isset($_GET['oauth_action']))
exit("No <tt>oauth_action</tt> specified.");


$oauth = new OAuth($config[$service_id]['key'],$config[$service_id]['secret'],OAUTH_SIG_METHOD_HMACSHA1,OAUTH_AUTH_TYPE_URI);

switch($_GET['oauth_action']){
	case 'check_auth':
		// check for a session that looks valid
		exit_json(isset($_SESSION[$service_id])
				&& isset($_SESSION[$service_id]['token'], 
				$_SESSION[$service_id]['secret']));
	break;
	case 'auth':
		// initialize authentication
		$_SESSION[$service_id] = array();
		
		$request_token_info = $oauth->getRequestToken($config[$service_id]['request']);
		$_SESSION[$service_id]['secret'] = $request_token_info['oauth_token_secret'];
		
		header(sprintf("Location: %s?oauth_token=%s",
			$config[$service_id]['auth'],
			$request_token_info['oauth_token']
		));
		
		exit();
	break;
	case 'complete':
		// service redirects back to here
		$oauth->setToken($_GET['oauth_token'],$_SESSION[$service_id]['secret']);
    		$access_token_info = $oauth->getAccessToken($config[$service_id]['access'],null,$_GET['oauth_verifier']);
    		$_SESSION[$service_id]['token'] = $access_token_info['oauth_token'];
   		$_SESSION[$service_id]['secret'] = $access_token_info['oauth_token_secret'];
		exit('<html><head><script>window.opener["'.$_GET['oauth_client_callback'].'"]();self.close()</script></head></html>');
	break;
	case 'api':
		// access a protected resource through the api
		$oauth->setToken($_SESSION[$service_id]['token'],$_SESSION[$service_id]['secret']);
		
		$service_params = isset($_GET['oauth_api_params']) ? json_decode($_GET['oauth_api_params'],true) : array();
		$service_method = isset($_GET['oauth_api_method']) ? constant('OAUTH_HTTP_METHOD_'.strtoupper($_GET['oauth_api_method'])) : OAUTH_HTTP_METHOD_GET;
		//$service_headers= isset($_GET['oauth_api_params']) ? json_decode($_GET['oauth_api_params'],true) : array();
  		
  		$oauth->fetch(sprintf($config[$service_id]['api'], $_GET['oauth_api']), $service_params, $service_method, array('Connection'=>'close'));
  		
  		exit($oauth->getLastResponse());
  		
	break;
	
	default:
		exit("Unrecognized <tt>oauth_action</tt> specified.");
}


?>
