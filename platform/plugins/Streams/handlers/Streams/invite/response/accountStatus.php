<?php

function Streams_invite_response_accountStatus() {
	if (empty($_REQUEST['token'])) {
		throw new Q_Exception("Missing token!");
	}
	$invite = new Streams_Invite();
	$invite->token = $_REQUEST['token'];
	if (!$invite->retrieve()) {
		throw new Q_Exception("Wrong token '".$invite->token."'!");
	}
	$user = new Users_User();
	$user->id = $invite->userId;
	if (!$user->retrieve()) {
		throw new Users_Exception_NoSuchUser();
	}
	if ($user->passphraseHash or $user->getAllXids()) {
		// there is a reliable way to reconnect with this account
		return "complete";
	}
}