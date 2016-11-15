<?php

function Users_contact_response_contacts($params = array())
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
	if (isset($labels)) {
		if (is_string($labels)) {
			$labels = explode(",", $labels);
		}
	}
	if (isset($req['contactUserIds'])) {
		$contactUserIds = $req['contactUserIds'];
		if (is_string($userIds)) {
			$contactUserIds = explode(",", $contactUserIds);
		}
	}
	$contacts = array();
	if (isset($req['contactUserIds'])) {
		// expects batch format, i.e. $contacts, $labels and $contactUserIds
		foreach ($userIds as $i => $userId) {
			$contact = new Users_Contact();
			$contact->userId = $userId;
			$contact->label = $labels[$i];
			$contact->contactUserId = $contactUserIds[$i];
			$contacts[] = $contact->retrieve() ? $contact : null;
		}
	} else {
		$contacts = array();
		foreach ($userIds as $i => $userId) {
			$contacts = array_merge($contacts, Users_Contact::fetch($userId, $labels));
		}
	}
	return Q_Response::setSlot('contacts', Db::exportArray($contacts));
}