<?php

include("Q.inc.php");
$ms = ceil(Q::milliseconds());
$htmlAttributes = Q_Response::htmlAttributes();
$baseUrl = Q_Request::baseUrl();
echo <<<EOT


	<!DOCTYPE html>
	<html $htmlAttributes>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<title>Fast loading page</title>
		<link rel="shortcut icon" href="$baseUrl/favicon.ico" type="image/x-icon">
	</head>
	<body>

		<h1>Even Faster Loading Page</h1>
		<p>
			This is a naked PHP script that includes the Qbix Platform as a library, like this:
		</p>
		<pre>
			&lt;?php include ("Q.inc.php") ?&gt;
		</pre>
		<p>
			In this scenario, the entire Qbix environment is ready to go in <strong>$ms milliseconds</strong>!
		</p>
		<p>
			Try refreshing this page, and it will probably load even faster.
		</p>
 
	</body>
	</html>
	
EOT;
