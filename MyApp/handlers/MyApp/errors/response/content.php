<?php

function MyApp_errors_response_content($params)
{
	Q_Response::errorHeaderCode();
	$url = Q_Request::url();
	$tail = Q_Request::tail();
	return Q::view('MyApp/content/errors.php', @compact('url', 'tail'));
}
