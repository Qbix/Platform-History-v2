<?php

function Users_after_Q_request_languages($params, &$result)
{
	$user = Users::loggedInUser(false, false);
	if ($user && $user->preferredLanguage) {
		if (!is_array($result)) {
			$result = array();
		}
		array_unshift($result, array($user->preferredLanguage, $user->preferredLanguage, 1));
	}
}