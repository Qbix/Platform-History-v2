<?php
	
function Users_web3_response_handOff () {
	Users::loggedInUser(true);
	Q_Valid::nonce(true);

	$duration = Q_Config::expect('Users', 'web3', 'capability', 'handoff');
	$result = array(
		'Q.Users.appId' => Users::communityId(),
		'Q.Users.newSessionId' => Q_Session::id(),
		'Q.timestamp' => time() + $duration
	);
	$result['Q.Users.signature'] = Q_Utils::sign($result)["Q.sig"];

	return $result;
}