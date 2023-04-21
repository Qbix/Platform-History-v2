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
    $contract = $request['contract'];
    
    $user->setXid($platform, $contract);
    $user->save();
    $externalFrom = new Users_ExternalFrom();
    $externalFrom->userId   = $user->id;
    $externalFrom->xid	    = $contract;
    $externalFrom->platform = "web3";
    $externalFrom->appId    = $chainId;
    $externalFrom->save(true);
    // also saves externalTo,
    // because it triggered afterSaveExecute

}