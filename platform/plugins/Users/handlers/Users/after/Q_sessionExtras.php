<?php

function Users_after_Q_sessionExtras() {
	if ($preloaded = Users_User::$preloaded) {
		Q_Response::setScriptData(
			'Q.plugins.Users.User.preloaded',
			Db::exportArray($preloaded, array('asAvatar' => true))
		);
	}
	$roles = Users::roles();
	foreach ($roles as $label => $role) {
		Q_Response::addHtmlCssClass('Users_role-'.ucfirst(Q_Utils::normalize($role->label)));
		Q_Response::setScriptData('Q.plugins.Users.roles.'.$label, $role->exportArray());
	}
	$user = Users::loggedInUser(false, false);
	Q_Response::setScriptData("Q.plugins.Users.capability", Users::capability()->exportArray());
	Q_Response::addHtmlCssClass($user ? 'Users_loggedIn' : 'Users_loggedOut');
}
