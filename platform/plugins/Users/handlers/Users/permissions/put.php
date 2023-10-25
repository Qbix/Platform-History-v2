<?php

/**
 * dynamically edit permissions
 * @param {array} $_REQUEST
 * @param {string} $_REQUEST.userId The userId(CommunityId)
 * @param {string} $_REQUEST.label The label
 */
function Users_permissions_put($params = array())
{
	$req = array_merge($_REQUEST, $params);
	Q_Request::requireFields(array(
		'userId',
		'label'
	), $req, true);
	
//	if (empty(Users::roles(null, array('Users/owners')))) {
//		throw new Users_Exception_NotAuthorized();
//    }
	$quota = Users_Quota::check($user->id, '', 'Users/permissions');
	if (empty($req['toGrant'])) {
		$req['toGrant'] = array();
	}
	if (empty($req['toRevoke'])) {
		$req['toRevoke'] = array();
	}
	
	$perm = new Users_Permission();
	$perm->userId = $req['userId'];
	$perm->label = $req['label'];
	$perm->permission = implode('/', array('Users', 'communities', 'roles'));//Users/communities/roles
	$result = $perm->retrieve();
	
	$extras = $perm->getAllExtras();
	
	if (empty($extras['canGrant'])) {
		$extras['canGrant'] = array();
	} else {
		$perm->clearExtra('canGrant');
	}
	
	if (empty($extras['canRevoke'])) {
		$extras['canRevoke'] = array();
	} else {
		$perm->clearExtra('canRevoke');
	}
	
	$extras['canGrant'] = array_values(array_diff($extras['canGrant'], $req['toRevoke']));
	$extras['canRevoke'] = array_values(array_diff($extras['canRevoke'], $req['toRevoke']));
	
	foreach($req['toGrant'] as $grantKey){
		if (!array_key_exists($grantKey, $extras['canGrant'])){
			array_push($extras['canGrant'], $grantKey);
		}
		if (!array_key_exists($grantKey, $extras['canRevoke'])){
			array_push($extras['canRevoke'], $grantKey);
		}
	}
	
	// update extras
	$perm->setExtra(array(
		'canGrant' => $extras['canGrant'],
		'canRevoke' => $extras['canRevoke']
	));
	$perm->save();
	
	$quota->used(1);
	
	Q_Response::setSlot('result', true);
}