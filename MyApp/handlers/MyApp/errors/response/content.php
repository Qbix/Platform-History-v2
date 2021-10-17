<?php

function MyApp_errors_response_content($params)
{
	header('HTTP/1.0 503 Server Encountered Error');
	$url = Q_Request::url();
	$tail = Q_Request::tail();
	return Q::view('MyApp/content/errors.php', @compact('url', 'tail'));
}
