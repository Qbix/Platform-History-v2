<?php

function Users_label_response_batch($params = array())
{
	$req = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array('batch'), $req, true);
	$batch = $req['batch'];
	$batch = json_decode($batch, true);
	if (!isset($batch)) {
		throw new Q_Exception_WrongValue(array(
			'field' => 'batch', 
			'range' => '{userIds: [...], labels: [...]}'
		));
	}
	Q_Valid::requireFields(array('userIds', 'labels'), $batch, true);
	$userIds = $batch['userIds'];
	$labels = $batch['labels'];
	if (is_string($labels)) {
		$labels = explode(",", $labels);
	}
	$rows = Q::event('Users/contact/response/labels', @compact(
		'userIds', 'labels', 'batch'
	));
	$result = array();
	foreach ($rows as $row) {
		$result[] = array('slots' => array('label' => $row));
	}
	Q_Response::setSlot('batch', $result);
}