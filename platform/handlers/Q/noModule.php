<?php

/**
 * Default Q/noModule handler.
 * Just displays Q/notFound.php view.
 */
function Q_noModule($params)
{
	header("HTTP/1.0 404 Not Found");
	$url = Q_Request::url();
	echo Q::view('Q/notFound.php', @compact('url'));
}
