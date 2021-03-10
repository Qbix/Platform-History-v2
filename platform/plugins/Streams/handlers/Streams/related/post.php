<?php

/**
 * Used to create a new relation
 *
 * @param array $_REQUEST 
 *   toPublisherId, toStreamName, type
 *   fromPublisherId, fromStreamName, weight
 * @return {void}
 */

function Streams_related_post($params) {
	$user = Users::loggedInUser(true);
	$asUserId = $user->id;
	$toPublisherId = $_REQUEST['toPublisherId'];
	$toStreamName = $_REQUEST['toStreamName'];
	$type = $_REQUEST['type'];
	$fromPublisherId = $_REQUEST['fromPublisherId'];
	$fromStreamName = $_REQUEST['fromStreamName'];
	
	// TODO: When we start supporting multiple hosts, this will have to be rewritten
	// to make servers communicate with one another when establishing relations between streams
	$categories = Streams::fetch($asUserId, $toPublisherId, $toStreamName);
	if (empty($categories)) {
		throw new Q_Exception_MissingRow(
			array('table' => 'stream', 'criteria' => 'with those fields'), 
			array('publisherId', 'name')
		);
	}

	$streams = Streams::fetch($asUserId, $fromPublisherId, $fromStreamName);
	if (empty($streams)) {
		throw new Q_Exception_MissingRow(
			array('table' => 'stream', 'criteria' => 'with those fields'),
			array('fromPublisherId', 'from_name')
		);
	}

	$weight = time();
	foreach ($categories as $category) {
		foreach ($streams as $stream) {
			// check maxRelations attribute
			if (!Streams::checkAvailableRelations(null, $category->publisherId, $category->name, $type, array(
				"postMessage" => false,
				"throw" => !($_REQUEST["exception"] === false || $_REQUEST["exception"] === "false")
			))) {
				return;
			}

			if (isset($_REQUEST['weight'])) {
				if (!$category->testWriteLevel('relations')) {
					if ($_REQUEST["exception"] === false || $_REQUEST["exception"] === "false") {
						return;
					} else {
						throw new Users_Exception_NotAuthorized();
					}
				}
				$weight = $_REQUEST['weight'];
			}
		}
	}

	$result = Streams::relate(
		$asUserId, 
		$toPublisherId, 
		$toStreamName, 
		$type, 
		$fromPublisherId, 
		$fromStreamName,
		compact('weight')
	);
	Q_Response::setSlot('result', $result);
}