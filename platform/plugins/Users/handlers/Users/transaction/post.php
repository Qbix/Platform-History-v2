<?php

function Users_transaction_post($params)
{
    $userId = Users::loggedInUser(true)->id;
    $request = array_merge($params, $_REQUEST);
    
    if (empty(Users::roles($request['communityId'], array('Users/owners')))) {
	throw new Users_Exception_NotAuthorized();
    }
    
    $web3Transaction = new Users_Web3Transaction();
    $web3Transaction->chainId = $request["chainId"];
    $web3Transaction->transactionId = $request["transactionId"];
    $web3Transaction->fromAddress = $request["fromAddress"];
    $web3Transaction->methodName = $request["methodName"];
    $web3Transaction->params = $request["params"];
    $web3Transaction->userId = $userId;
    $web3Transaction->extra = json_encode(array("communityId" => $request["communityId"]));
    //$web3Transaction->status = 'pending';
    $web3Transaction->contract = $request["contract"];
    $web3Transaction->save();
    
    Q_Response::setSlot("result", true);

}