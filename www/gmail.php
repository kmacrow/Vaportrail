<?php

error_reporting(E_ALL);
ini_set('display_errors', '1');

define('GMAIL_HOSTNAME', '{imap.gmail.com:993/imap/ssl}INBOX');

/* output json */
function echo_json($mixed){
	echo json_encode($mixed);
}

function exit_json($mixed){
	exit(json_encode($mixed));
}


$action = trim($_SERVER['PATH_INFO'], "/");

if(empty($action))
exit();

switch($action){

    case 'auth':
    
        $inbox = imap_open(GMAIL_HOSTNAME, $_POST['username'], $_POST['password']);
        
       
        exit_json(array('status' => ($inbox == false ? false : true) ));
        
    break;
    case 'head':
        
        $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
        $limit  = isset($_GET['limit'])  ? intval($_GET['limit'])  : 10;
        $result = array('status' => true, 'offset' => 0, 'emails' => array());
        
        $inbox = imap_open(GMAIL_HOSTNAME, $_POST['username'], $_POST['password']);
        
        if(!$inbox){
            $result['status'] = false;
            exit_json($result);
        }    
        
        
        if($offset == 0){
            $seq_nums = imap_search($inbox, 'ALL');
            $offset =  $seq_nums[ count($seq_nums) - 1 ];   
        } 
        
        
        $result['offset'] = $offset;
        
        
        for($i = $offset; $i >= ($offset - $limit); $i--){
               
               $headers = imap_fetch_overview($inbox, $i, 0);
               $email = get_object_vars($headers[0]);
               
               $result['emails'][] = $email;
        }
        
        
        imap_close($inbox);
        exit_json($result);
       
       
    break; 
    
    case 'body':
    
        $num = isset($_GET['num']) ? intval($_GET['num']) : 0;
        
        if(!$num){
            exit();
        }
        
        $inbox = imap_open(GMAIL_HOSTNAME, $_POST['username'], $_POST['password']);
        
        echo imap_body($inbox, $num, FT_PEEK);
        
        imap_close($inbox);
    
    break;
      
    case 'since':
   
         $since = isset($_GET['since']) ? intval($_GET['since']) : 0;
         $result = array('status'=>true,'emails'=>array());
   
         $inbox = imap_open(GMAIL_HOSTNAME, $_POST['username'], $_POST['password']);
         
         if(!$inbox){
            $result['status'] = false;
            exit_json($result);
         }
         
         $emails = imap_search($inbox, 'ALL');
        
         $num_emails = $emails[count($emails) - 1];
         
         if($since >= $num_emails){
            imap_close($inbox);
            exit_json($result);
         }
         
         
         for($i = $since + 1; $i <= $num_emails; $i++){
               
               $headers = imap_fetch_overview($inbox, $i, 0);
               $email = get_object_vars($headers[0]);
               $email['body'] = imap_body($inbox, $i, FT_PEEK);
               
               $result['emails'][] = $email;
         }
         
         imap_close($inbox);
         exit_json($result);
        
    break;
    
}

?>
