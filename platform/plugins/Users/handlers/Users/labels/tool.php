<?php
function Users_labels_tool($options) {
    //Q_Valid::requireFields(array('chainId', 'communityAddress'), $options, true);
    
    $chainId = $options['chainId'];
    $userId = $options['userId'];
    $abiPathCommunity = Q::ifset($options, "abiPath", "Users/templates/R1/Community/contract");
    
    Q_Valid::requireFields(array('userId'), $options, true);
    
    $communityRow = Users_User::fetch($options['userId'], true);
    
    // getting $communityAddress
    $communityAddress = null;

    $communityAddress = $communityRow->getXid("web3_{$options['chainId']}");
    $communityAddress = !isset($communityAddress) ? $communityRow->getXid("web3_all") : $communityAddress;
    $options["communityAddress"] = $communityAddress;
    // ------------------------------
    $user = Users::loggedInUser(true);
    $userWallet = null;
    
    

//    $updateCache = Q::ifset($options, 'updateCache', false);
//	if ($updateCache) {
//		$caching = null;
//		$cacheDuration = 0;
//	} else {
//		$caching = true;
//		$cacheDuration = null;
//	}
    $caching = false;
    $cacheDuration = 0;
    
    //$canAddWeb3 = false;
    $canAddWeb3 = $options["canAddWeb3"];
    //$web3Roles = Users_Web3::execute($abiPathCommunity, $communityAddress, "getRoles", array(), $chainId, $caching, $cacheDuration);
    if (
        isset($chainId) &&
        isset($communityAddress)
    ) {
        $userWallet = null;
        $userWallet = $user->getXid("web3_{$options['chainId']}");
        $userWallet = !isset($userWallet) ? $user->getXid("web3_all") : $userWallet;
        if ($userWallet) {
            try {

                $tx = Users_Web3::execute($abiPathCommunity, $communityAddress, "isOwner", array($userWallet), $chainId, $caching, $cacheDuration);
//var_dump($tx);
                $canAddWeb3 = ($tx == 1) ? true : false;
            } catch (Exception $e) {
                $canAddWeb3 = false;
                //die('[ERROR] ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString() . PHP_EOL);
            }
        }
    }
    
    
    
//if (!Users::isCommunityId($user->id)) {
    $canAddWeb3 = array();
    
    $user_apps_chains = Q_Config::get("Users", "apps", "web3", array());
                

    foreach($user_apps_chains as &$chain) {
        if (!$chain['appId'] || $chain['appIdForAuth'] == 'all') {
            continue;
        }
        
        $tmp = new Users_ExternalTo();
        $tmp->platform = 'web3';
        $tmp->userId = $userId;
        $tmp->appId = $chain['appId'];

        $ret = $tmp->retrieve();
        
        $userWallet = null;
        $userWallet = $user->getXid("web3_{$chain['appId']}");
        $userWallet = !isset($userWallet) ? $user->getXid("web3_all") : $userWallet;
        
        if ($ret && $ret->xid && $userWallet) {
            array_push($canAddWeb3,
                array(
                    'communityAddress' => $ret->xid,
                    'userWallet' => $userWallet,
                    'name' => $chain['name'],
                    'chainId' => $chain['appId'],
                    'userId' => $userId,
//                    'platform' => 'web3',

                )
            );
        }

    }
    unset($chain);
    
    // or maybe will be better just to get all xids with a single query

    //$options["chains"] = $chains;
    
    
    
    
    //These options are used just to pre-check, draw the button, 
    //and prevent unnecessary attempts to send a transaction on the blockchain. 
    //The transaction cannot be mined if the sender is not in the owners' role.
    $options["canAddWeb3"] = $canAddWeb3;

	Q_Response::setToolOptions($options);
}