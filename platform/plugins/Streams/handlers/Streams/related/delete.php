<?php

function Streams_related_delete($params) {
	$user = Users::loggedInUser(true);
	$asUserId = $user->id;
	$toPublisherId = $_REQUEST['toPublisherId'];
	$toStreamName = $_REQUEST['toStreamName'];
	$type = $_REQUEST['type'];
	$fromPublisherId = $_REQUEST['fromPublisherId'];
	$fromStreamName = $_REQUEST['fromStreamName'];
	
	// TODO: When we start supporting multiple hosts, this will have to be rewritten
	// to make servers communicate with one another when establishing relations between streams
	
	if (!($stream = Streams::fetch($asUserId, $toPublisherId, $toStreamName))) {
		Q_Response::setSlot('result', false);
	}
	if (!($stream = Streams::fetch($asUserId, $fromPublisherId, $fromStreamName))) {
		Q_Response::setSlot('result', false);
	}

	Streams::unrelate($asUserId, $toPublisherId, $toStreamName, $type, $fromPublisherId, $fromStreamName);
	Q_Response::setSlot('result', true);
}