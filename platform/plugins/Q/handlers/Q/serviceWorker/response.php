<?php

function Q_serviceWorker_response()
{
    header("Content-Type: text/javascript");

	$cookies_json = Q::json_encode(Q_Response::$cookies);

	echo <<<JS
/************************************************
 * Qbix Platform plugins have added their own code
 * to this service worker through the config named
 * Q/javascript/serviceWorker/modules
 ************************************************/
JS;

	echo PHP_EOL . PHP_EOL;
	echo Q_ServiceWorker::inlineCode();
	echo PHP_EOL . PHP_EOL;
	echo <<<JS
/************************************************
 * Below, Qbix Platform plugins have a chance to 
 * add their own code to this service worker by
 * adding hooks after the "Q/serviceWorker" event.
 ************************************************/
JS;
			
	echo PHP_EOL . PHP_EOL;
	
	// Give a chance for other hooks to output some code.
	Q::event("Q/serviceWorker/response", array(), 'after');

	// TODO: output the other service worker code here from plugins
	// TODO: output the httponly cookies in the service worker, inside a closure
	// and use it to sign things.
	// TODO: also send the httponly cookies again on every request,
	// TODO: listen to Set-Cookie-JS headers and update cookies
	// Every time the script is reloaded, it will get the latest cookies.
	// And then Set-Cookie-JS will set the cookies there.
	// Notice that other sites won't be able to get this,
	// make sure that CORS headers do NOT include access-control-allow-origin

    return false;
}