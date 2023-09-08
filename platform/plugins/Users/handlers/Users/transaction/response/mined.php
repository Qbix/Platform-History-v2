<?php
/**
 * 
 * @param type $params
 */
/**
 * Removes a contact from the system.
 * @param {array} $params
 * @param {string} $params.communityId
 * @param {string} $params.chainId
 * @param {string} $params.address
 */
function Users_transaction_response_mined($params)
{
    $request = array_merge($params, $_REQUEST);
    
    // try to check is request was from owner or cron-job
    if (empty($params) && empty(Users::roles($request['communityId'], array('Users/owners')))) {
        throw new Users_Exception_NotAuthorized();
    }
    
    $user = Users::fetch($request['communityId'], true);
    $chainId = $request['chainId'];
    $appId = $request['chainId'];
    $contract = $request['contract'];
    $platform = 'web3';
            
    $externalTo = new Users_ExternalTo();
    $externalTo->userId   = $user->id;
    $externalTo->platform = $platform;
    $externalTo->appId    = $appId;
    $data = $externalTo->retrieve();
    
    if ($data->xid) {
    } else {
        $user->setXid($platform."_".$appId, $contract);
        $user->save();
        
        $externalTo->xid	    = $contract;
        $externalTo->save(true);
    }
         
    
    // also saves externalTo,
    // because it triggered afterSaveExecute

}