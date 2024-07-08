<?php

/**
 * Default Q/notFound handler.
 * Just displays Q/notFound.php view.
 */
function Q_notFound($params)
{
	Q_Response::code(404);
	Q_Dispatcher::result("Nothing found");
	$url = Q_Request::url();
	echo Q::view('Q/notFound.php', @compact('url'));
}
