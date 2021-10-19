<?php

function Streams_after_Users_Contact_saveExecute($params)
{
	$inserted = $params['inserted'];
	$modifiedFields = $params['modifiedFields'];
	$contact = $params['row'];
	if ($inserted) {
		Streams_Message::post(null, $contact->userId, 'Streams/contacts', array(
			'type' => 'Streams/contacts/inserted',
			'instructions' => array('contact' => $contact->exportArray())
		), true);
	} else {
		$updates = Q::take($modifiedFields, array('nickname'));
		$updates = array_merge($contact->toArray(), $updates);
		Streams_Message::post(null, $contact->userId, 'Streams/contacts', array(
			'type' => 'Streams/contacts/updated',
			'instructions' => @compact('updates')
		), true);
	}
}