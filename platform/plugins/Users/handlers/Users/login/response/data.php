<?php

function Users_login_response_data()
{
	$user = $roles = null;
	if ($row = Users::loggedInUser()) {
		$user = $row->exportArray();
		$roles = Users::roles();
	}
	return @compact('user', 'roles');
}