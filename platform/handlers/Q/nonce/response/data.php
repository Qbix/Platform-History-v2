<?php

function Q_nonce_response_data()
{
	$method = Q_Request::method();
	if ($method !== 'POST') {
		throw new Q_Exception_MethodNotSupported(compact('method'));
	}

	// we could technically return the nonce in the response,
	// because other sites can't read the response from a cross-domain post
	// but we aren't going to do that because we already set the cookie
	// so just return true
	return true;
}
