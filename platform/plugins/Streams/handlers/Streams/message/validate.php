<?php

function Streams_message_validate($params)
{
	// Protect against CSRF attacks:
	if (Q_Request::method() !== 'GET') Q_Valid::nonce(true);
	
	$type = Streams::requestedType();
	if ($type && Q::canHandle("Streams/validate/message/$type"))
		return Q::event("Streams/validate/message/$type", $params);
}
