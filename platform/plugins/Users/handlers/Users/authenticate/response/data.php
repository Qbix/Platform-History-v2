<?php

function Users_authenticate_response_data()
{
	if (empty(Users::$cache['user'])) {
		return false;
	}
	$data = Users::$cache['user']->exportArray();
	$data['authenticated'] = Users::$cache['authenticated'];
	return $data;
}