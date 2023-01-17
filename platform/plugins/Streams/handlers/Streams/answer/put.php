<?php
function Streams_answer_put ($params) {
	$user = Users::loggedInUser(true);
	Q_Valid::nonce(true);

	$request = array_merge($_REQUEST, $params);
	$content = Q::ifset($request, "content", null);

	$publisherId = Streams::requestedPublisherId(true);
	$streamName = Streams::requestedName(true);
	$stream = Streams_Stream::fetch($user->id, $publisherId, $streamName);
	if (!$stream) {
		throw new Q_Exception_MissingRow(array(
			'table'    => 'stream',
			'criteria' => 'with that name'
		));
	}
	if (!$stream->testWriteLevel("join")) {
		throw new Users_Exception_NotAuthorized();
	}

	$options = array(
		'userId' => $user->id,
		'extra' => array()
	);
	if (empty($content)) {
		$options["extra"] = array(
			"content" => ''
		);
		$stream->leave($options);
	} else {
		$options["extra"] = array(
			"content" => $content
		);
		$stream->join($options);
	}

	$stream->post($user->id, array(
		'type' => 'Streams/extra/changed',
		'content' => $content
	), true);
}