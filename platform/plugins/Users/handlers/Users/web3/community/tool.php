<?php

function Users_web3_community_tool($options) {
    Q_Valid::requireFields(array('communityId'), $options, true);
    
    $communityId = $options['communityId'];
    
    $user_apps_chains = Q_Config::get("Users", "apps", "web3", array());
    $chains = array();
    foreach($user_apps_chains as &$chain) {
        if (!$chain['appId'] || $chain['appIdForAuth'] == 'all') {
            continue;
        }
        $tmp = new Users_ExternalTo();
        $tmp->platform = 'web3';
        $tmp->userId = $communityId;
        $tmp->appId = $chain['appId'];

        $ret = $tmp->retrieve();
        array_push($chains,
            array(
                'platform' => 'web3',
                'userId' => $communityId,
                'appId' => $chain['appId'],
                'chainId' => $chain['appId'],
                'name' => $chain['name'],
                'xid' => $ret ? $ret->xid : false
            )
        );

    }
    unset($chain);
    
    // or maybe will be better just to get all xids with a single query

    $options["chains"] = $chains;
    
                
    Q_Response::setToolOptions($options);
}
	