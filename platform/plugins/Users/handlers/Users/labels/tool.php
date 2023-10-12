<?php
function Users_labels_tool($options) {
    //Q_Valid::requireFields(array('chainId', 'communityAddress'), $options, true);
  
    $userId = $options['userId'];
    $abiPathCommunity = Q::ifset($options, "abiPath", "Users/templates/R1/Community/contract");
    
    Q_Valid::requireFields(array('userId'), $options, true);
    
    // ------------------------------
    $user = Users::loggedInUser(true);
    
    $caching = false;
    $cacheDuration = 0;
    
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
        
//        $userWallet = $user->getXid("web3_{$chain['appId']}");
//        $userWallet = !isset($userWallet) ? $user->getXid("web3_all") : $userWallet;
        $userWallet = $user->getXid("web3_all");
        
        if ($ret && $ret->xid && $userWallet) {
            $communityAddress = $ret->xid;
            try {
                $tx = Users_Web3::execute($abiPathCommunity, $communityAddress, "isOwner", array($userWallet), $chain['appId'], $caching, $cacheDuration);
                $isOwner = ($tx == 1) ? true : false;
            } catch (Exception $e) {
                $isOwner = false;
                //die('[ERROR] ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString() . PHP_EOL);
            }
            
            array_push($canAddWeb3,
                array(
                    'communityAddress' => $communityAddress,
                    'userWallet' => $userWallet,
                    'name' => $chain['name'],
                    'chainId' => $chain['appId'],
                    'userId' => $userId,
                    'isOwner' => $isOwner
//                    'platform' => 'web3',

                )
            );
        }

    }
    unset($chain);
    
    //These options are used just to pre-check, draw the button, 
    //and prevent unnecessary attempts to send a transaction on the blockchain. 
    //The transaction cannot be mined if the sender is not in the owners' role.
    $options["canAddWeb3"] = $canAddWeb3;

	Q_Response::setToolOptions($options);
}