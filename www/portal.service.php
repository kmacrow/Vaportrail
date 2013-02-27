<?php

/* output json */
function echo_json($mixed){
	echo json_encode($mixed);
}

function exit_json($mixed){
	exit(json_encode($mixed));
}

// bootstrap session
session_start();

// no rpc/service specified?
if(!isset($_GET['service']))
exit_json(false);


function service_module($module){
	return sprintf('portal.service.%s.inc.php',$module);
}

// service:
switch($_GET['service']){
    
	case 'oauth':
		require_once(service_module('oauth'));
	break;
	case 'flickr':
		require_once(service_module('flickr'));

	default:
		exit_json(false);

}



?>
