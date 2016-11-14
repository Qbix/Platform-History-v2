<?php

function Users_contact_response_batch($params = array())
{
	$req = array_merge($_REQUEST, $params);
	Q_Request::requireFields(array('batch'));
	$batch = $req['batch'];
	$batch = json_decode($batch, true);
	if (!isset($batch)) {
		throw new Q_Exception_WrongValue(array(
			'field' => 'batch', 
			'range' => '{userIds: [...], labels: [...], contactUserIds: [...]}'
		));
	}
	Q_Valid::requireFields(array('userIds', 'labels', 'contactUserIds'), $batch, true);
	$userIds = $batch['userIds'];
	$labels = $batch['labels'];
	$contactUserIds = $batch['contactUserIds'];
	$users = Q::event('Users/contact/response/contacts', compact(
		'userIds', 'labels', 'contactUserIds'
	));
	$result = array();
	foreach ($userIds as $userId) {
		$result[] = array('slots' => 
			array('contact' => isset($users[$userId]) ? $users[$userId] : null)
		);
	}
	Q_Response::setSlot('batch', $result);
}