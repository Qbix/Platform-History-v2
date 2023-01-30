<?php

function Streams_register_response_data()
{
	$fields = Users::responseData(array(
		'setPassword' => true
	));
	if (Users::loggedInUser(false, false)) {
		if (!empty($fields['user'])) {
			$fields['user']['displayName'] = Streams::displayName($fields['user']->id);
		}
	}
	return $fields;
}