<?php

/**
 * Invitation mailer.
 *
**/

// shared secret
$_secret1 = '3b59dca6f57d0ed00872890e0dde0dba';
$_secret2 = 'f118ae3076cfd1e03a3b426576fbb264';

$_admin_email = 'kalanwm@cs.ubc.ca';
$_base_link = 'http://vaportrail.nss.cs.ubc.ca/invite/?';
$_base_app = 'http://vaportrail.nss.cs.ubc.ca';
$_reply_email = 'no-reply@vaportrail.nss.cs.ubc.ca';

/*
$_magic_invite = array('andy@cs.ubc.ca','aiello@cs.ubc.ca','norm@cs.ubc.ca',
			'brendan@cs.ubc.ca','jslegare@cs.ubc.ca','totolici@cs.ubc.ca');
*/

// service endpoints/rpcs
$_SERVICES = array('request' => array(
				'method' => 'POST'
			),
		   'issue'  => array(
		   		'method' => 'GET'
		   	),
		   'accept' => array(
		   		'method' => 'GET'
		   	)
);




// check request validity
if(!isset($_GET['action'])
	|| !array_key_exists($_GET['action'], $_SERVICES)
	|| $_SERVICES[$_GET['action']]['method'] !== $_SERVER['REQUEST_METHOD']){

	exit();
	
}


// process rpcs
switch($_GET['action']){
	case 'request':
	
		// client requests an invitation
		if(!isset($_POST['email'])){
			exit();
		}
		$issue_link = $_base_link . "action=issue&non=$_secret1&key=".$_POST['email'];
	
		
		mail($_admin_email,
			'Vaportrail Invite Request - '. date("l F j, Y"),
			"Issue Invite: $issue_link",
			"From: $_reply_email\r\n\r\n");
		
		mail($_POST['email'],
			'Thank you for your interest in Vaportrail!',
			file_get_contents('welcome.email.txt'),
			"From: $_reply_email\r\n\r\n");
		
	
		exit('1');	
			
	
	break;
	
		// admin approves request and issues invite
	case 'issue':
		if(!isset($_GET['key'])){
			exit('No key specified.');
		}
		if(!isset($_GET['non'])
			|| $_GET['non'] != $_secret1){
			exit('Invalid nonce.');	
		}
	
		$accept_link = $_base_link. 'action=accept&non='.$_secret2.'&key='. $_GET['key'];
		$invite_text = file_get_contents('invitation.email.txt');
		$invite_text = str_replace('${accept_link}', $accept_link, $invite_text);
		
		mail($_GET['key'],
			'Welcome to Vaportrail!',
			$invite_text,
			"From: $_reply_email\r\n\r\n");
		
		exit('Ivitation issued.');	
	
	break;
	
		// client accepts invitation
	case 'accept':
		if(!isset($_GET['key'], $_GET['non'])
			|| $_GET['non'] != $_secret2){
			header("Location: $_base_app");
			exit();
		}
		
		setcookie('__vpti', md5(time()), time()+60*60*24*30, '/', 'vaportrail.nss.cs.ubc.ca', false, false);
		
		
		mail($_admin_email,
			'Vaportrail Invite Accepted',
			'Invite accepted by '.$_GET['key'],
			"From: $_reply_email\r\n\r\n");
		
	
		header("Location: $_base_app");
		
		
}


?>
