<?php

/**
 * @module Users
 */

/**
 * Used by HTTP clients to fetch one more more labels
 * @class HTTP Users label
 * @method GET/labels
 * @param {array} [$params] Parameters that can come from the request
 *   @param {string|array} [$params.userIds] The users whose labels to fetch. Can be a comma-separated string
 *   @param {string|array} [$params.filter] Optionally filter by specific labels, or label prefixes ending in "/". Can be a comma-separated string
 * @return {array} An array of Users_Label objects.
 */
function Users_web3_response_labels($params = array())
{
    
	$req = array_merge($_REQUEST, $params);
    
    Q_Valid::requireFields(array('chainId'), $req, true);
    Q_Valid::requireFields(array('communityAddress'), $req, true);
    Q_Valid::requireFields(array('walletAddress'), $req, true);
    
    $chainId = $req['chainId'];
    $communityAddress = $req['communityAddress'];
    //$userId = $req['userId'];
    $abiPathCommunity = Q::ifset($req, "abiPath", "Users/templates/R1/Community/contract");
    $walletAddress = $req['walletAddress'];
            
    $updateCache = Q::ifset($req, 'updateCache', false);
	if ($updateCache) {
		$caching = null;
		$cacheDuration = 0;
	} else {
		$caching = true;
		$cacheDuration = null;
	}
    
    $ret = array();
    $caching = false;
    $cacheDuration = 0;    
    try {

        $ret['allRoles'] = Users_Web3::execute($abiPathCommunity, $communityAddress, "getRoles()", array(), $chainId, $caching, $cacheDuration);
    } catch (Exception $e) {
        die('[ERROR] ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString() . PHP_EOL);
    }
    
    try {
        
        $tmp = Users_Web3::execute($abiPathCommunity, $communityAddress, "getRoles(address[])", array($walletAddress), $chainId, false/*$caching*/, $cacheDuration);
        // stupid thing. need force toString() to convert object BigInt to number
        foreach($tmp[0] as &$tmp2) {
            $tmp2 = $tmp2 . '';
        }
        unset($tmp2);
        
        $ret['userRoles'] = $tmp[0];
        
    } catch (Exception $e) {
        die('[ERROR] ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString() . PHP_EOL);
    }
//	if (!isset($req['userId']) and !isset($req['userIds'])) {
//		throw new Q_Exception_RequiredField(array(
//			'field' => 'userId'
//		), 'userId');
//	}
//	$userIds = isset($req['userIds']) ? $req['userIds'] : array($req['userId']);
//	if (is_string($userIds)) {
//		$userIds = explode(",", $userIds);
//	}
//	$filter = null;
//	if (isset($req['filter'])) {
//		$filter = $req['filter'];
//	} else if (isset($req['label'])) {
//		$filter = array($req['label']);
//	}

//	if (isset($req['batch'])) {
//		// expects batch format, i.e. $userIds and $filter arrays
//		foreach ($userIds as $i => $userId) {
//			$row = new Users_Label();
//			$row->userId = $userId;
//			$row->label = $filter[$i];
//			$rows[] = $row->retrieve() ? $row : null;
//		}
//	} else {
//		foreach ($userIds as $i => $userId) {
//			$rows = array_merge($rows, Users_Label::fetch($userId, $filter));
//		}
//	}
	return Q_Response::setSlot('labels', $ret);
}