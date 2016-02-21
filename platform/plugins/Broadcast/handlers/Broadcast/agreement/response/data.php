<?php

function Broadcast_agreement_response_data()
{
	$streamName = is_array($_REQUEST['streamName'])
		? implode('/', $_REQUEST['streamName'])
		: $_REQUEST['streamName'];
	
	if (!isset(Broadcast::$cache['agreement'])) {
		$user = Users::loggedInUser(true);
		$agreement = new Broadcast_Agreement();
		$agreement->userId = $user->id;
		$agreement->publisherId = $_REQUEST['publisherId'];
		$agreement->streamName = $_REQUEST['streamName'];
		if ($agreement->retrieve()) {
			Broadcast::$cache['agreement'] = $agreement;
		} else {
			Broadcast::$cache['agreement'] = false;
		}
	}
	$agreed = !empty(Broadcast::$cache['agreement']);
	return compact('agreed');
}