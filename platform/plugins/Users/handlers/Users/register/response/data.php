<?php

function Users_register_response_data()
{
	$user = Q::ifset(Users::$cache['user']);
	return array('user' => $user ? $user->exportArray() : null);
}