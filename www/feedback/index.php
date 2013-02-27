<?php

/** 
 * Feedback mailer.
 *
**/



if($_SERVER['REQUEST_METHOD'] !== 'POST'){
	exit('0');
}

if(!isset($_POST['message'], $_POST['email'])
	|| empty($_POST['message'])){
	exit('0');	
}


if(strlen($_POST['message']) > 1400){
	exit('0');
}

if(empty($_POST['email'])){
	$_POST['email'] = 'no-reply@vaportrail.nss.cs.ubc.ca'; 
}


$_POST['message'] = htmlentities($_POST['message']);


mail("kalanwm@cs.ubc.ca", 
	"Vaportrail Feedback - ". date("l F j, Y"), 
	$_POST['message'], 
	"From: no-reply@vaportrail.nss.cs.ubc.ca\r\n".
	"Reply-to: ". $_POST['email'] ."\r\n\r\n");
	
	
exit('1');


?>
