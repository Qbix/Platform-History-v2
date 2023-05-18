<?php

function Streams_stream_response_content()
{
	$publisherId = Streams::requestedPublisherId(true);
	$streamName = Streams::requestedName(true);
	$fields = Streams::requestedFields();
	$user = Users::loggedInUser();
	$userId = $user ? $user->id : 0;
	$stream = isset(Streams::$cache['stream']) ? Streams::$cache['stream'] : null;

	if (!isset($stream) or !$stream->testReadLevel('see')) {
		throw new Q_Exception_MissingRow(array('table' => 'stream', 'criteria' => 'that name'));
	}
	if ($publisherId != $userId and !$stream->testReadLevel('content')) {
		$text = Q_Text::get('Streams/content');
		Q_Response::setNotice(
			'Streams/stream/response/content', 
			$text['errors']['HiddenFromYou'], true
		);
		return '';
	}

	// show stream as usual
	return Q::view('Streams/content/stream.php', @compact(
		'publisherId', 'streamName', 'fields',
		'user', 'stream'
	));
}
