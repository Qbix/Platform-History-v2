<?php

/**
 * Renders a tool which can view and manage Community's roles
 * @class Users roles
 * @constructor
 * @param {Object} [$options] this object contains function parameters
 * @param {String} [$options.userId=Users::loggedInUser(true)] userId 
 * @param {String} [$options.chainId] chainId
 * @param {String} [$options.communityAddress] community contract's address
 * @param {Boolean} [$options.canAddWeb2] able to add Web2 role.
 * @param {Boolean} [$options.canAddWeb3] able to add Web3 role. just pre-check option. 
 *      If user have wallet script will check possibility to add new web3 role and override this option
 *      The option will be set to false if the user has not granted it.
 * @param {String} [$options.abiPath='Users/templates/R1/Community/contract'] abi path to CommunityContract
 * @param {Boolean} [$options.updateCache] caching
 */
function Users_roles_tool($options) {
    
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
    
    $canAddWeb3 = $options["canAddWeb3"];
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
