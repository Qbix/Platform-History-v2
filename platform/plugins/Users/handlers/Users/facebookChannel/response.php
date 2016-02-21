<?php

function Users_facebookChannel_response()
{
	$cache_expire = 60*60*24*365;
	header("Pragma: public");
	header("Cache-Control: max-age=".$cache_expire);
	header('Expires: ' . gmdate('D, d M Y H:i:s', time()+$cache_expire) . ' GMT');
	echo <<<EOT
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
   "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" >
<head>
    <title>Cross-Domain Receiver Page</title>
</head>
<body>
    <script src="//connect.facebook.net/en_US/sdk.js"></script>
</body>
</html>
EOT;
	return false;
}