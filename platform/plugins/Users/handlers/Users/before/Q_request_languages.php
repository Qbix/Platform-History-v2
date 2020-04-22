<?php
function Users_before_Q_request_languages($params, &$result) {
	$user = Users::loggedInUser();

	if ($user && $user->preferredLanguage) {
		$result = array(array($user->preferredLanguage, 1 => $user->preferredLanguage, 2 => 1));
	}
}