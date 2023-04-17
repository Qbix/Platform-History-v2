<?php

function Users_transaction_put($params)
{
    if (empty($params) && empty(Users::roles(null, array('Users/owners')))) {
	throw new Users_Exception_NotAuthorized();
    }
    
    $params = array_merge($params, $_REQUEST);
    
    $chainId = $params["chainId"];

    $communityId = $params["communityId"];
    
    $web3Transaction = new Users_Web3Transaction();
    $web3Transaction->chainId = $chainId;
    $web3Transaction->transactionId = $params["transactionId"];
    
    $web3Transaction->retrieve();
    
    if ($web3Transaction->status == "pending") {
	$web3Transaction->status = $params["status"];
	$web3Transaction->result = $params["result"];
	//$web3Transaction->contract = $address;
	$web3Transaction->save(true);
	
	
	$address = $params["contract"];
	Q::event(
	    "Users/transaction/response/mined", $params
	);
    }
    
    Q_Response::setSlot("result", true);

}