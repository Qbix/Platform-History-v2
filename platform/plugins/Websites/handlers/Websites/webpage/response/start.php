<?php
	
function Websites_webpage_response_start($params)
{
	Q_Valid::nonce(true);

	$userId = Q::ifset($params, 'userId', Users::loggedInUser(true)->id);

	$r = array_merge($_REQUEST, $params);

	$publisherId = Q::ifset($r, 'publisherId', null);
	$streamName = Q::ifset($r, 'streamName', null);

	if (!$publisherId) {
		throw new Exception("publisherId required");
	}
	if (!$streamName) {
		throw new Exception("streamName required");
	}

	$stream = Streams::fetchOne($userId, $publisherId, $streamName);

	if (!$stream) {
		throw new Exception("stream not found");
	}

	Streams::relate(
		null,
		Users::communityId(),
		'Streams/chats/main',
		'Streams/chat',
		$stream->publisherId,
		$stream->name,
		array(
			'skipAccess' => true,
			'weight' => time()
		)
	);
}