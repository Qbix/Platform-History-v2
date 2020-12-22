<?php
	
function Websites_webpage_post($params)
{
	Q_Valid::nonce(true);

	$request = array_merge($_REQUEST, $params);

	$stream = Websites_Webpage::createStream($request);

	Q_Response::setSlot('publisherId', $stream->publisherId);
	Q_Response::setSlot('streamName', $stream->name);

	// this action for conversation composer
	// need to relate webpage stream to Streams/chats/main and create first chat message
	if (Q::ifset($request, 'action', null) == 'start') {
		$message = Q::ifset($request, 'message', null);
		if (!$stream) {
			throw new Exception("stream not found");
		}

		$userId = Q::ifset($request, 'userId', Users::loggedInUser(true)->id);
		$currentCommunity = Users::currentCommunityId(true);

		$communityId = Q::ifset($request, 'categoryStream', 'publisherId', $currentCommunity);
		$mainChatCategory = Q::ifset($request, 'categoryStream', 'streamName', 'Streams/chats/main');
		$chatRelationType = Q::ifset($request, 'categoryStream', 'relationType', 'Websites/webpage');

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
	}

	return $stream;
}