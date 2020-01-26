<?php
	
function Websites_webpage_response_start($params)
{
	Q_Valid::nonce(true);

	$userId = Q::ifset($params, 'userId', Users::loggedInUser(true)->id);

	$r = array_merge($_REQUEST, $params);

	$message = Q::ifset($r, 'message', null);

	$stream = Websites_Webpage::createStream($r['data'], 'Websites/webpage/conversation');

	if (!$stream) {
		throw new Exception("stream not found");
	}

	$communityId = Users::currentCommunityId();
	$mainChatCategory = 'Streams/chats/main';
	$chatRelationType = 'Websites/webpage';

	// if this stream already related, exit
	if (!Streams_RelatedTo::select()->where(array(
		'toPublisherId' => $communityId,
		'toStreamName' => $mainChatCategory,
		'type' => $chatRelationType,
		'fromPublisherId' => $stream->publisherId,
		'fromStreamName' => $stream->name
	))->fetchDbRows()) {
		Streams::relate(
			null,
			$communityId,
			$mainChatCategory,
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

	return array(
		'publisherId' => $stream->publisherId,
		'streamName' => $stream->name
	);
}