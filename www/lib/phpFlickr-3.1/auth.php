<?php
    /* Last updated with phpFlickr 2.3.2
     *
     * Edit these variables to reflect the values you need. $default_redirect 
     * and $permissions are only important if you are linking here instead of
     * using phpFlickr::auth() from another page or if you set the remember_uri
     * argument to false.
     */
     
    // duplicated in portal.service.flickr
    $api_key                 = "dad024b7bfec1ce9757fe655a22d963a";
    $api_secret              = "4c7caf0f37f69fe4";
    $default_redirect        = "/portal.service.php?service=flickr&flickr_action=auth_callback";
    $permissions             = "read";
    //$path_to_phpFlickr_class = "./";

    session_start();

    ob_start();
    
    require_once("phpFlickr.php");
    
    unset($_SESSION['phpFlickr_auth_token']);
     
	if ( isset($_SESSION['phpFlickr_auth_redirect']) && !empty($_SESSION['phpFlickr_auth_redirect']) ) {
		$redirect = $_SESSION['phpFlickr_auth_redirect'];
		unset($_SESSION['phpFlickr_auth_redirect']);
	}
    
    $f = new phpFlickr($api_key, $api_secret);
 
    if (empty($_GET['frob'])) {
        $f->auth($permissions, false);
    } else {
        $f->auth_getToken($_GET['frob']);
    }
    
    //if (empty($redirect)) {
    header("Location: " . $default_redirect);
    /*
    } else {
		header("Location: " . $redirect);
    }
    */
 
?>
