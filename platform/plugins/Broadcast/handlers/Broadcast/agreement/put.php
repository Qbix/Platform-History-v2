<?php

function Broadcast_agreement_put()
{
	$user = Users::loggedInUser(true);
	foreach (array('publisherId', 'streamName') as $field) {
		if (empty($_REQUEST[$field])) {
			throw new Q_Exception_RequiredField(compact('field'));
		}
	}
	$streamName = is_array($_REQUEST['streamName'])
		? implode('/', $_REQUEST['streamName'])
		: $_REQUEST['streamName'];
	
	$agreement = new Broadcast_Agreement();
	$agreement->userId = $user->id;
	$agreement->publisherId = $_REQUEST['publisherId'];
	$agreement->streamName = $streamName;
	$agreement->platform = 'facebook';
	$agreement->details_json = '';
	if (!$agreement->retrieve()) {
		$agreement->save();
	}
	Broadcast::$cache['agreement'] = $agreement;
}