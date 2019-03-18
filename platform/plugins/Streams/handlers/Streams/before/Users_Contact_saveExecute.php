<?php

function Streams_before_Users_Contact_saveExecute($params)
{
	$contacts = array($params['row']); // the new values about to be written
	if ($params['query']->type === Db_Query::TYPE_UPDATE) {
		// we are updating an existing contact
		$contacts = array_merge(
			$contacts,
			Users_Contact::select()
				->where($params['where'])
				->limit(1)
				->fetchDbRows()
		);
	}
	
	// Update avatar as viewed by everyone who was in that contacts list
	foreach ($contacts as $contact) {
		Streams_Avatar::updateAvatar($contact->contactUserId, $contact->userId);
	}
}