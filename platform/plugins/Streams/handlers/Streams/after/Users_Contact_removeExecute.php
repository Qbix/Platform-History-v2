<?php

function Streams_after_Users_Contact_removeExecute($params)
{	
	// Update avatar as viewed by everyone who was in that contacts list
	$contacts =	Streams::$cache['contacts_removed'];
	foreach ($contacts as $contact) {
		Streams_Avatar::updateAvatar($contact->contactUserId, $contact->userId);
		Streams_Message::post(null, $contact->userId, 'Streams/contacts', array(
			'type' => 'Streams/contacts/removed',
			'instructions' => array('contacts' => Db::exportArray($contacts))
		), true);
	}
}