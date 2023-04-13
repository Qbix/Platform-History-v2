<?php

/**
 * @module Users
 */

/**
 * Used by HTTP clients to fetch one more more labels
 * @class HTTP Users label
 * @method GET/labels
 * @param {array} [$params] Parameters that can come from the request
 *   @param {string|array} [$params.userIds] The users whose labels to fetch. Can be a comma-separated string
 *   @param {string|array} [$params.filter] Optionally filter by specific labels, or label prefixes ending in "/". Can be a comma-separated string
 * @return {array} An array of Users_Label objects.
 */
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
	$filter = null;
	if (isset($req['filter'])) {
		$filter = $req['filter'];
	} else if (isset($req['label'])) {
		$filter = array($req['label']);
	}
	$rows = array();
	if (isset($req['batch'])) {
		// expects batch format, i.e. $userIds and $filter arrays
		foreach ($userIds as $i => $userId) {
			$row = new Users_Label();
			$row->userId = $userId;
			$row->label = $filter[$i];
			$rows[] = $row->retrieve() ? $row : null;
		}
	} else {
		foreach ($userIds as $i => $userId) {
			$rows = array_merge($rows, Users_Label::fetch($userId, $filter));
		}
	}
	return Q_Response::setSlot('labels', Db::exportArray($rows));
}