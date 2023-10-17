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
function Users_web3_response_allLabels($params = array())
{
    
	$req = array_merge($_REQUEST, $params);
    
    Q_Valid::requireFields(array('chainId'), $req, true);
    Q_Valid::requireFields(array('communityAddress'), $req, true);
    
    $chainId = $req['chainId'];
    $communityAddress = $req['communityAddress'];
    //$userId = $req['userId'];
    $abiPathCommunity = Q::ifset($req, "abiPath", "Users/templates/R1/Community/contract");
            
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

        $ret = Users_Web3::execute($abiPathCommunity, $communityAddress, "allRoles()", array(), $chainId, $caching, $cacheDuration);
		//if ($ret['allRoles']->error) {
		//	die('[ERROR] from blockchain response' . PHP_EOL);	
		//}
    } catch (Exception $e) {
        die('[ERROR] ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString() . PHP_EOL);
    }
    
	return Q_Response::setSlot('allLabels', $ret);
}