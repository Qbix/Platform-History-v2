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
	$config = Q_Config::get('Users', 'communities', 'roles', array());
	foreach (array('canGrant', 'canRevoke', 'canSee') as $can) {
		$results = array();
		foreach ($roles as $r => $contact) {
			if ($info = Q::ifset($config, $r, null)) {
				if ($more = Q::ifset($info, $can, false)) {
					$results = array_merge($results, $more);
				}
			}
		}
		Q_Response::setScriptData("Q.plugins.Users.Label.$can", $results);
	}
	$user = Users::loggedInUser(false, false);
	Q_Response::setScriptData("Q.plugins.Users.capability", Users::capability()->exportArray());
	Q_Response::addHtmlCssClass($user ? 'Users_loggedIn' : 'Users_loggedOut');
}
