<?php

function Streams_register_response_data()
{
	$user = Q::ifset(Users::$cache['user']);
	if (!$user) {
		return array('user' => null);
	}
	$u = $user->exportArray();
	$u['displayName'] = Streams::displayName($user);
	return array('user' => $u);
}