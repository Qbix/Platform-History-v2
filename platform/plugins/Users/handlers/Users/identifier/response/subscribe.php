<?php

function Users_identifier_response_subscribe($params)
{
	Q_Valid::nonce(true);

	$user = Users::loggedInUser(true);

	$r = array_merge($_REQUEST, $params);
	$fields = Q::take($r, array('identifier', 'type'));
	$identifier = $fields['identifier'];
	$type = $fields['type'];

	$dbStreams = Db::connect('Streams');
	if ($type == 'email') {
		$dbStreams->rawQuery("update users_email set state='active' where userId='".$user->id."' and address='".$identifier."'")->execute();
	} elseif ($type == 'mobile') {
		$dbStreams->rawQuery("update users_mobile set state='active' where userId='".$user->id."' and number='".$identifier."'")->execute();
	}

	return true;
}
