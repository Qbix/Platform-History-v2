<?php

function Users_after_Q_responseExtras() {
	if ($preloaded = Users_User::$preloaded) {
		Q_Response::setScriptData(
			'Q.plugins.Users.User.preloaded',
			Db::exportArray($preloaded, array('asAvatar' => true))
		);
	}
	$roles = Users::roles();
	foreach ($roles as $label => $role) {
		Q_Response::setScriptData('Q.plugins.Users.roles.'.$label, $role);
	}
	$user = Users::loggedInUser(false, false);
	Q_Response::addHtmlCssClass($user ? 'Users_loggedIn' : 'Users_loggedOut');
}
