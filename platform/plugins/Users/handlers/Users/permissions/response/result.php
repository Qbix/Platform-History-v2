<?php
function Users_permissions_response_result($params = array())
{
	$req = array_merge($_REQUEST, $params);
    
    Q_Valid::requireFields(array('userId', 'label'), $req, true);

	$ret = array();
	
	$tmp = Users_Label::canManage($req['userId'], $req['label']);
	$ret['labels'] = $tmp['labels'];
	$ret['locked'] = $tmp['locked'];
	
	return Q_Response::setSlot('result', $ret);
}
    