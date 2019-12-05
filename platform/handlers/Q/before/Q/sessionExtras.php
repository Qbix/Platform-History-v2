<?php

/**
 * This is the default handler for the Q/sessionExtras event.
 * It should not be invoked during regular AJAX requests, and especially
 * not during JSONP requests. It will output things like the nonce,
 * which prevents CSRF attacks, but is only supposed to be printed
 * on our webpages and not also given to anyone who does a JSONP request.
 */
function Q_before_Q_sessionExtras()
{
	$app = Q::app();
	$nonce = Q_Session::calculateNonce();
	if ($nonce) {
		Q_Response::setScriptData('Q.nonce', $nonce);
	}
}
