<?php
	
function Websites_webpage_response_start($params)
{
	Q_Valid::nonce(true);

	$userId = Q::ifset($params, 'userId', Users::loggedInUser(true)->id);

	$r = array_merge($_REQUEST, $params);

	$publisherId = Q::ifset($r, 'publisherId', null);
	$streamName = Q::ifset($r, 'streamName', null);
	$message = Q::ifset($r, 'message', null);

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

	$communitiesId = Users::communityId();
	$mainChatCategory = 'Streams/chats/main';
	$chatRelationType = 'Websites/webpage';

	// if this stream already related, exit
	if (Streams_RelatedTo::select()->where(array(
		'toPublisherId' => $communitiesId,
		'toStreamName' => $mainChatCategory,
		'type' => $chatRelationType,
		'fromPublisherId' => $stream->publisherId,
		'fromStreamName' => $stream->name
	))->fetchDbRows()) {
		return;
	}

	Streams::relate(
		null,
		$communitiesId,
		$mainChatCategory,
		$chatRelationType,
		$stream->publisherId,
		$stream->name,
		array(
			'skipAccess' => true,
			'weight' => time()
		)
	);

	// if $message not empty, set it as first message to chat
	if (!empty($message)) {
		Streams_Message::post(
			$userId,
			$publisherId,
			$streamName,
			array(
				'type' => "Streams/chat/message",
				'content' => $message
			)
		);
	}
}