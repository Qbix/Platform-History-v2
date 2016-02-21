<?php

function Streams_publisher_validate($params)
{
	// Protect against CSRF attacks:
	Q_Valid::nonce(true);
	
	$type = Streams::requestedType();
	if ($type && Q::canHandle("Streams/validate/$type"))
		return Q::event("Streams/validate/$type", $params);
}
