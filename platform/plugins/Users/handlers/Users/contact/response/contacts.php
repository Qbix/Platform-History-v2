<?php

function Users_contact_response_contacts($params = array())
{
	$req = array_merge($_REQUEST, $params);
	Q_Request::requireFields(array('userIds', 'labels', 'contactUserIds'));
	$userIds = $req['userIds'];
	if (is_string($userIds)) {
		$userIds = explode(",", $userIds);
	}
	$labels = $req['labels'];
	if (is_string($labels)) {
		$labels = explode(",", $labels);
	}
	$contactUserIds = $req['contactUserIds'];
	if (is_string($userIds)) {
		$contactUserIds = explode(",", $contactUserIds);
	}
	$contacts = Users_Contact::select('*')
		->whereMulti(
			'userId' => $userIds,
			'label' => $labels,
			'contactLabelId' => $contactLabelIds
		)->fetchDbRows(null, null, 'label,id');
	return Q_Response::setSlot('contacts', Db::exportArray($contacts));
}