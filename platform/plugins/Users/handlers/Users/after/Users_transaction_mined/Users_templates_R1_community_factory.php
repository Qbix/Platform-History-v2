<?php

function Users_after_Users_transaction_mined_Users_templates_R1_community_factory($params)
{
    $transaction = $params['transaction'];
    $communityId = $transaction->getExtra('communityId');
    $contract = $request['contract'];
            
    $externalTo = new Users_ExternalTo();
    $externalTo->userId   = $communityId;
    $externalTo->platform = 'web3';
    $externalTo->appId    = $transaction->chainId;
    $data = $externalTo->retrieve();
    
    if (!$data->xid) {
        $user = Users::fetch($communityId, true);
        $user->setXid("web3_$appId", $transaction->contract);
        $user->save();
        
        $externalTo->xid = $contract;
        $externalTo->save(true); // this also saves externalTo
    }
}