<?php

function Users_identifier_response_data()
{
	$user = Users::loggedInUser();
	return $user ? $user->exportArray() : null;
}