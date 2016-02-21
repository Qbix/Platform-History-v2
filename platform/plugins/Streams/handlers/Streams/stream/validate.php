<?php

function Streams_stream_validate($params)
{
	// Protect against CSRF attacks:
	if (Q_Request::method() !== 'GET') Q_Valid::nonce(true);
	
	$type = Streams::requestedType();
	if ($type && Q::canHandle("Streams/validate/$type"))
		return Q::event("Streams/validate/$type", $params);
}
