<?php
	
function Websites_webpage_post($params)
{
	Q_Valid::nonce(true);

	Users::loggedInUser(true);

	$r = array_merge($_REQUEST, $params);

	if (Q::ifset($r, 'action', null)) {
		return Websites_webpage_start($r);
	}

	$stream = Websites_Webpage::createStream($r);

	Q_Response::setSlot('publisherId', $stream->publisherId);
	Q_Response::setSlot('streamName', $stream->name);
}

function Websites_webpage_start ($r) {
	$userId = Q::ifset($r, 'userId', Users::loggedInUser(true)->id);

	$message = Q::ifset($r, 'message', null);

	$stream = Websites_Webpage::createStream($r['data'], 'Websites/webpage/conversation');

	if (!$stream) {
		throw new Exception("stream not found");
	}

	$publisherId = Q::ifset($r, 'categoryStream', 'publisherId', Users::communityId());
	$streamName = Q::ifset($r, 'categoryStream', 'streamName', 'Streams/chats/main');
	$chatRelationType = Q::ifset($r, 'relationType', 'Websites/webpage');

	// if this stream already related, exit
	if (!Streams_RelatedTo::select()->where(array(
		'toPublisherId' => $publisherId,
		'toStreamName' => $streamName,
		'type' => $chatRelationType,
		'fromPublisherId' => $stream->publisherId,
		'fromStreamName' => $stream->name
	))->fetchDbRows()) {
		Streams::relate(
			null,
			$publisherId,
			$streamName,
			$chatRelationType,
			$stream->publisherId,
			$stream->name,
			array(
				'skipAccess' => true,
				'weight' => time()
			)
		);
	}

	// if $message not empty, set it as first message to chat
	if (!empty($message)) {
		Streams_Message::post(
			$userId,
			$stream->publisherId,
			$stream->name,
			array(
				'type' => "Streams/chat/message",
				'content' => $message
			)
		);
	}

	Q_Response::setSlot('data', array(
		'publisherId' => $stream->publisherId,
		'streamName' => $stream->name
	));
}