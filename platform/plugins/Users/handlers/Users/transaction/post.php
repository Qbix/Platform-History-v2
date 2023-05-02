<?php
/**
 * Used to put transaction hash in to database
 * call by user(owners) or by cron-job so $params $_REQUEST will be merged
 * @class HTTP Users transaction
 * @method POST
 * @param $params 
 * @param {string} $params.communityId Required, The user id of the community, should be belong to 'Users/owners'
 * @param {string} $params.chainId Required, chain id 
 * @param {string} $params.transactionId Required, transaction hash. In the future, by this hash we will determine is transaction mined or not
 * @param {string} $params.fromAddress Required, address which initiated transaction
 * @param {string} $params.methodName Required, method name in contract
 * @param {string} $params.params Required, JSON of parameters of method name. if parameters are empty should be "()" or smth like that
 * @param {string} $params.contract Required, contract's address which initiated transaction 
 * @return void
 */
function Users_transaction_post($params)
{
    $userId = Users::loggedInUser(true)->id;
    $request = array_merge($params, $_REQUEST);
    
	Q_Request::requireFields(array(
		'communityId',
		'chainId', 
		'transactionId',
		'fromAddress',
		'methodName',
		'params',
		'contract'
	), true);
		
    if (empty(Users::roles($request['communityId'], array('Users/owners')))) {
		throw new Users_Exception_NotAuthorized();
    }

	$web3Transaction = new Users_Web3Transaction(
		array(
			"chainId"		=> $request["chainId"],
			"transactionId" => $request["transactionId"],
			"fromAddress"	=> $request["fromAddress"],
			"methodName"	=> $request["methodName"],
			"params"		=> $request["params"],
			"userId"		=> $userId,
			"extra"			=> json_encode(array("communityId" => $request["communityId"])),
			"contract"		=> $request["contract"]
		)
	);
    

    //$web3Transaction->status = 'pending';
	
    $web3Transaction->save();
    
    Q_Response::setSlot("result", true);

}