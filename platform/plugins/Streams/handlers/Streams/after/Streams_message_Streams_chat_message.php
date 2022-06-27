<?php

function Streams_after_Streams_message_Streams_chat_message($params)
{
	$message = $params['message'];
	$chatStream = $params['stream'];

	$matches = array();
	preg_match_all("/@[a-z]{8}/", $message->content, $matches);

	if (!is_array($matches[0]) || !count($matches[0])) {
		return;
	}

	foreach ($matches[0] as $match) {
		$userId = str_replace('@', '', $match);
		$displayName = Streams::displayName($message->byUserId, array('show' => 'fl'));
		$mentionStream = Streams_Stream::fetch($userId, $userId, 'Streams/mentioned');

		if (!$mentionStream) {
			continue;
		}

		$mentionStream->post($message->byUserId, array(
			'type' => 'Streams/mention',
			'content' => ' ',
			'instructions' => array(
				'url' => $chatStream->url($message->ordinal),
				'displayName' => $displayName,
				'title' => $chatStream->title
			)
		), true);
	}
}