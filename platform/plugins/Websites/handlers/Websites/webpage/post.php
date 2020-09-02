<?php
	
function Websites_webpage_post($params)
{
	Q_Valid::nonce(true);

	$r = array_merge($_REQUEST, $params);

	if (Q::ifset($r, 'action', null) == 'start') {
		$result = Q::event("Websites/webpage/response/start", $r);
		return Q_Response::setSlot('data', $result);
	}

	$stream = Websites_Webpage::createStream($r);

	Q_Response::setSlot('publisherId', $stream->publisherId);
	Q_Response::setSlot('streamName', $stream->name);

	return $stream;
}