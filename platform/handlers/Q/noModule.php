<?php

/**
 * Default Q/noModule handler.
 * Just displays Q/notFound.php view.
 */
function Q_noModule($params)
{
	Q_Response::code(404);
	$url = Q_Request::url();
	echo Q::view('Q/notFound.php', @compact('url'));
}
