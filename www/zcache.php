<?php
    
// TODO: Doesn't work....    
    
$params = explode("/", trim($_SERVER['PATH_INFO'], "/"));  

echo 'Path info: ', $_SERVER['PATH_INFO'];

print_r($params);

exit();


if(!file_exists('./zcache/'.$params[1])){
    exit();
}

/*
header('Content-Encoding: gzip');
header('Cache-Control: public');
header('Expires: ' . gmdate ("D, d M Y H:i:s", time() + 60 * 60 * 24 * 30) . ' GMT'); 
header('Last-Modified: ' . gmdate( 'D, d M Y H:i:s' ) . ' GMT'); 
*/

//readfile('./zcache/'.$params[1]);
exit('./zcache/'.$params[1]);
    
?>
