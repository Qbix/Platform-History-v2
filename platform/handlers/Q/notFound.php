<?php

/**
 * Default Q/notFound handler.
 * Just displays Q/notFound.php view.
 */
function Q_notFound($params)
{
	header("HTTP/1.0 404 Not Found");
	Q_Dispatcher::result("Nothing found");
	$url = Q_Request::url();
	echo Q::view('Q/notFound.php', @compact('url'));
}
