<?php

/**
 * Used to update relations
 *
 * @param array $_REQUEST
 *   toPublisherId, toStreamName, type, fromPublisherId, fromStreamName
 *   weight, adjustWeights
 * @return {void}
 */
function Streams_related_put($params) {
	$user = Users::loggedInUser(true);
	$userId = $user ? $user->id : '';
	$toPublisherId = $_REQUEST['toPublisherId'];
	$toStreamName = $_REQUEST['toStreamName'];
	$type = $_REQUEST['type'];
	$fromPublisherId = $_REQUEST['fromPublisherId'];
	$fromStreamName = $_REQUEST['fromStreamName'];
	$weight = $_REQUEST['weight'];

	$result = Streams::updateRelation(
		$userId, 
		$toPublisherId, 
		$toStreamName, 
		$type,
		$fromPublisherId, 
		$fromStreamName,
		$weight, 
		1
	);

	Q_Response::setSlot('result', $result);
}
