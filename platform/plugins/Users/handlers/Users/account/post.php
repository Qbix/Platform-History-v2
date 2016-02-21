<?php

function Users_account_post()
{
	Q_Session::start();
	Q_Valid::nonce(true);

	extract($_REQUEST);

	// Implement the action

	$user = Users::loggedInUser(true);
}
