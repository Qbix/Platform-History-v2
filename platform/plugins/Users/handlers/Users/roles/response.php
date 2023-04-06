<?php

/**
 * Find out what the logged-in user can do with certain roles
 */
function Users_roles_response()
{
	$communityId = Q::ifset($_REQUEST, 'communityId', null);
	$roles = Users::roles($communityId);
	Q_Response::setSlot('roles', array_keys($roles));
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
		Q_Response::setSlot($can, $results);
	}
}