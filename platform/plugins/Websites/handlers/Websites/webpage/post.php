<?php
	
function Websites_webpage_post($params)
{
	Q_Valid::nonce(true);

	Users::loggedInUser(true);

	$r = array_merge($_REQUEST, $params);

	$stream = Websites_Webpage::createStream(null, $r);

	Q_Response::setSlot('publisherId', $stream->publisherId);
	Q_Response::setSlot('streamName', $stream->name);
}