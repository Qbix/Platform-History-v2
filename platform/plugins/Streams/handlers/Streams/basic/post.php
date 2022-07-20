<?php

/**
 * Post one or more fields here to change the corresponding basic streams for the logged-in user
 * @param {array} $params Can include the following
 * @param {string} $params.firstName specify the first name directly
 * @param {string} $params.lastName specify the last name directly
 * @param {string} $params.fullName the user's full name, which if provided will be split into first and last name and override them
 * @param {string} $params.gender the user's gender
 * @param {string} $params.birthday_year the year the user was born
 * @param {string} $params.birthday_month the month the user was born
 * @param {string} $params.birthday_day the day the user was born
 */
function Streams_basic_post($params = array())
{
	Q_Valid::nonce(true);
	$request = array_merge($_REQUEST, $params);
	$userId = Q::ifset($params, "userId", null);
	if ($userId) {
		$user = Users::fetch($userId);
	} else {
		$user = Users::loggedInUser(true);
	}

	$fields = array();
	if (!empty($request['birthday_year'])
	&& !empty($request['birthday_month'])
	&& !empty($request['birthday_day'])) {
		$request['birthday'] = sprintf("%04d-%02d-%02d",
			$_REQUEST['birthday_year'],
			$_REQUEST['birthday_month'],
			$_REQUEST['birthday_day']
		);
	}
//	$request['icon'] = $user->icon;
	if (isset($request['fullName'])) {
		$name = Streams::splitFullName($request['fullName']);
		$request['firstName'] = $name['first'];
		$request['lastName'] = $name['last'];
	}
	foreach (array('firstName', 'lastName', 'birthday', 'gender') as $field) {
		if (isset($request[$field])) {
			$fields[] = $field;
		}
	}
	$p = Streams::userStreamsTree();
	$names = array();
	foreach ($fields as $field) {
		$names[] = "Streams/user/$field";
	}
	$streams = Streams::fetch($user, $user->id, $names);
	foreach ($fields as $field) {
		$name = "Streams/user/$field";
		$type = $p->get($name, "type", null);
		if (!$type) {
			throw new Q_Exception("Missing $name type", $field);
		}
		$title = $p->get($name, "title", null);
		if (!$title) {
			throw new Q_Exception("Missing $name title", $field);
		}
		$stream = $streams[$name];
		if (isset($stream) and $stream->content === (string)$request[$field]) {
			continue;
		}
		if (!isset($stream)) {
			$stream = Streams::create($user->id, $user->id, $type, array(
				'name' => $name
			));
		}
		$messageType = $stream->wasRetrieved() ? 'Streams/changed' : 'Streams/created';
		$stream->content = (string)$request[$field];
		$stream->type = $type;
		$stream->title = $title;
		$stream->changed($user->id, false, $messageType);
	}
}
