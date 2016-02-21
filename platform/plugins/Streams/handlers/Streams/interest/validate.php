<?php

function Streams_interest_validate($params)
{
	// Protect against CSRF attacks:
	if (Q_Request::method() !== 'GET') Q_Valid::nonce(true);
}
