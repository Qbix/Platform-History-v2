<?php
function Users_session_response_signature ($params) {
	Users::loggedInUser(true);

	$secret = Q_Config::expect('Q', 'internal', 'secret');
	$data = $params ?: $_REQUEST["params"];

	return Q_Utils::signature($data, $secret);
}