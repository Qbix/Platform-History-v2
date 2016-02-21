<?php

function Users_account_response_data()
{
	$user = Users::loggedInUser();
	return $user ? $user->exportArray() : null;
}