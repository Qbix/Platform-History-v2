<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
function Users_roles_tool($options) {
	
	//Q_Valid::requireFields(array('communityCoinAddress'), $options, true);
    if (!isset($options['chainId'])) {
        throw new Q_Exception("Missed 'chaind' key");
    }
    
    Q_Valid::requireFields(array('chainId', 'communityAddress'), $options, true);
    
    if (!isset($options['userId'])) {
		$user = Users::loggedInUser(true);
		$options['userId'] = $user->id;
	} else {
		$user = Users_User::fetch($options['userId'], true);
        
	}
    $chainId = $options['chainId'];
    $communityAddress = $options['communityAddress'];
    $userId = $options['userId'];
    $abiPathCommunity = Q::ifset($options, "abiPath", "Users/templates/R1/Community/contract");
    
	
    // getting userWallet
    $userWallet = null;
    if ($user) {
        $options['userId'] = $user->id;
        $xids = $user->getAllXids();
        if ($xids) {
            $keys = array(
                "web3_{$options['chainId']}",
                "web3_all",
            );

            foreach($keys as $k) {
                if (isset($xids[$k])) {
                    $userWallet = $xids[$k];
                    break;
                }
            }
        }
	}
    
    $updateCache = Q::ifset($options, 'updateCache', false);
	if ($updateCache) {
		$caching = null;
		$cacheDuration = 0;
	} else {
		$caching = true;
		$cacheDuration = null;
	}
    
    $canAddWeb2 = false;
    // checking ability to add Web2 role
    $options["canAddWeb2"] = $canAddWeb2;
    
    $canAddWeb3 = false;
    if ($userWallet) {
        try {
            $tx = Users_Web3::execute($abiPathCommunity, $communityAddress, "isOwner", array($userWallet), $chainId, $caching, $cacheDuration);
            $canAddWeb3 = ($tx == 1) ? true : false;
        } catch (Exception $e) {
            die('[ERROR] ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString() . PHP_EOL);
        }
    }
    //These options are used just to pre-check, draw the button, 
    //and prevent unnecessary attempts to send a transaction on the blockchain. 
    //The transaction cannot be mined if the sender is not in the owners' role.
    $options["canAddWeb3"] = $canAddWeb3;
    
	Q_Response::setToolOptions($options);
	
}
