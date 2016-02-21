<?php

function Broadcast_stream_response_content()
{
	$publisherId = Streams::requestedPublisherId(true);
	$name = Streams::requestedName(true);
	$fields = Streams::requestedFields();
	
	$user = Users::loggedInUser();
	$userId = $user ? $user->id : 0;
	
	if (isset(Streams::$cache['stream'])) {
		$stream = Streams::$cache['stream'];
	} else {
		$streams = Streams::fetch(
			$userId,
			$publisherId,
			$name,
			$fields,
			array('limit' => 30)
		);
		if (empty($streams)) {
			throw new Q_Exception("No such stream", 'name');
		}
		$stream = reset($streams);
	}
	
	if ($publisherId != $userId and !$stream->testReadLevel('content')) {
		return "This belongs to someone else.";
	}
	
	if ($publisherId != $userId and !$stream->testReadLevel('content')) {
		throw new Users_Exception_NotAuthorized();
	}
	
	$userIds = array();
	$agreements = Broadcast_Agreement::select('userId')
		->where(array(
			'publisherId' => $publisherId,
			'streamName' => $name,
			'platform' => 'facebook'
		))->fetchDbRows();
	foreach ($agreements as $a) {
		$userIds[] = $a->userId;
	}
	if ($userIds) {
		$agreed_users = Users_User::select('*')
			->where(array('id' => $userIds))
			->fetchDbRows();
	} else {
		$agreed_users = array();
	}
	
	$src = 'Broadcast/widget?';
	$q = array(
		'publisherId' => $publisherId,
		'streamName' => $name
	);
	foreach (array('css', 'button', 'checkmark', 'explanation') as $field) {
		if (isset($_REQUEST[$field])) {
			$q[$field] = $_REQUEST[$field];
		}
	}
	$src .= http_build_query($q, null, '&');
	$style = 'border: 0px;';
	$code = Q_Html::tag('iframe', compact('src', 'style'), '');
	
	Q_Response::addScript('plugins/Broadcast/js/Broadcast.js');
	
	return Q::view('Broadcast/content/stream.php', compact(
		'publisherId', 'name', 'fields',
		'user', 'stream', 'agreed_users', 'code'
	));
}