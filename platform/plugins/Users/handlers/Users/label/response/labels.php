<?php

function Users_label_response_labels($params = array())
{
	$req = array_merge($_REQUEST, $params);
	if (!isset($req['userId']) and !isset($req['userIds'])) {
		throw new Q_Exception_RequiredField(array(
			'field' => 'userId'
		), 'userId');
	}
	$userIds = isset($req['userIds']) ? $req['userIds'] : array($req['userId']);
	if (is_string($userIds)) {
		$userIds = explode(",", $userIds);
	}
	if (isset($req['labels'])) {
		$labels = $req['labels'];
	} else if (isset($req['label'])) {
		$labels = array($req['label']);
	} else {
		$labels = null;
	}
	$rows = array();
	if (isset($req['batch'])) {
		// expects batch format, i.e. $userIds and $labels arrays
		foreach ($userIds as $i => $userId) {
			$row = new Users_Label();
			$row->userId = $userId;
			$row->label = $labels[$i];
			$rows[] = $row->retrieve() ? $row : null;
		}
	} else {
		foreach ($userIds as $i => $userId) {
			$rows = array_merge($rows, Users_Label::fetch($userId, $labels));
		}
	}
	return Q_Response::setSlot('labels', Db::exportArray($rows));
}