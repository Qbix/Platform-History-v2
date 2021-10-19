<?php

function Users_contact_response_batch($params = array())
{
	$req = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array('batch'), $req, true);
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
	$contacts = Q::event('Users/contact/response/contacts', @compact(
		'userIds', 'labels', 'contactUserIds', 'batch'
	));
	$result = array();
	foreach ($contacts as $contact) {
		$result[] = array('slots' => array('contact' => $contact));
	}
	Q_Response::setSlot('batch', $result);
}