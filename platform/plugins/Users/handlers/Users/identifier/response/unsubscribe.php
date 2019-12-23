<?php

function Users_identifier_response_unsubscribe($params)
{
	Q_Valid::nonce(true);

	$user = Users::loggedInUser(true);

	$r = array_merge($_REQUEST, $params);
	$fields = Q::take($r, array('identifier', 'type'));
	$identifier = $fields['identifier'];
	$type = $fields['type'];

	if ($type == 'email') {
		Users_Email::update()->set(array(
			'state' => 'unsubscribed'
		))->where(array(
			'userId' => $user->id,
			'address' => $identifier,
			'state!=' => 'unverified'
		))->execute();
		$res = Users_Email::select()->where(array('userId' => $user->id, 'address' => $identifier))->fetchDbRow();
		$res = Q::ifset($res, 'state', null);
	} elseif ($type == 'mobile') {
		Users_Mobile::update()->set(array(
			'state' => 'unsubscribed'
		))->where(array(
			'userId' => $user->id,
			'number' => $identifier,
			'state!=' => 'unverified'
		))->execute();
		$res = Users_Mobile::select()->where(array('userId' => $user->id, 'number' => $identifier))->fetchDbRow();
		$res = Q::ifset($res, 'state', null);
	}

	return $res;
}
