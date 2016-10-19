<?php

function Users_sessions_delete()
{
	if (empty($_REQUEST["sessionId"])) {
		throw new Q_Exceptions_RequiredField(array('field' => 'sessionId'));
	}
	$session = new Users_Session();
	$session->id = $_REQUEST['sessionId'];
	$session->retrieve(true);
	$content = Q::json_decode($session->content);
	$userId = Q::ifset($content, 'Users', 'loggedInUser', 'id');
	$loggedInUserId = Users::loggedInUser(true)->id;
	if ($userId === $loggedInUserId) {
		$authorized = true;
	} else {
		$app = Q::app();
		$roles = Users::roles();
		$authorized = !empty($roles["$app/admins"]);
	}
	if (!$authorized) {
		throw new Users_Exception_NotAuthorized();
	}
	$session->remove();
	Q_Response::setSlot('success', true);
}
