<?php
	
function Streams_after_Streams_create_Streams_chat($params)
{
	$stream = $params['stream'];
	$weight = time();

	// if chat is private - don't relate it to experience categories
	if ($stream->getAttribute('Streams.private')) {
		return;
	}

	$experienceId = $stream->get('experienceId', 'main');
	$experienceIds = is_array($experienceId) ? $experienceId : array("$experienceId");
	$communityId = Users::communityId();

	$categoryTypes = array("Streams/chats");
	foreach ($experienceIds as $experienceId) {
		foreach ($categoryTypes as $categoryType) {
			$name = $categoryType."/".$experienceId;
			$categoryStream = Streams_Stream::fetchOrCreate($communityId, $communityId, $name, array(
				'type' => 'Streams/category'
			));
			$stream->relateTo($categoryStream, 'Streams/chat', null, array(
				'skipAccess' => true,
				'weight' => $weight
			));
		}
	}
}