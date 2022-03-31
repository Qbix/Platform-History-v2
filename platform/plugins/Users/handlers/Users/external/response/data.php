<?php

function Users_external_response_data($params) {
	$req = array_merge($_REQUEST, $params);
	$loggedInUserId = Users::loggedInUser(true)->id;
	$userId = Q::ifset($req, "userId", $loggedInUserId);
	$adminLabels = Q_Config::get("Users", "communities", "admins", null);
	// if user try to update align profile or is not an admin
	if ($userId != $loggedInUserId && !(bool)Users::roles(null, $adminLabels, array(), $loggedInUserId)) {
		throw new Users_Exception_NotAuthorized();
	}

	$wallet = Users_Web3::getWalletById($userId);

	return compact("wallet");
}