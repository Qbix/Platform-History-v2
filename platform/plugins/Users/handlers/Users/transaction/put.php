<?php
/**
 * Used to update transaction status(and created instance) on database
 * call by user(owners) or by cron-job so $params $_REQUEST will be merged
 * @class HTTP Users transaction
 * @method PUT
 * @param $params 
 * @param {string} $params.communityId Required, The user id of the community, should be belong to 'Users/owners'
 * @param {string} $params.chainId Required, chain id 
 * @param {string} $params.transactionId Required, transaction hash. In the future, by this hash we will determine is transaction mined or not
 * @param {string} $params.status Required, status of transaction. can be 'mined'
 * @param {string} $params.result optional, result of receipt transaction. output of JSON-RPC `eth_getTransaction`
 * @param {string} $params.contract Required if $params["status"] == 'mined', address of created instance
 * @return void
 */
function Users_transaction_put($params)
{
    if (empty($params) && empty(Users::roles(null, array('Users/owners')))) {
		throw new Users_Exception_NotAuthorized();
    }
    
    $params = array_merge($params, $_REQUEST);
    
	Q_Request::requireFields(array(
		'communityId',
		'chainId', 
		'transactionId',
		'status',
		'result'
	), true);
	
    $web3Transaction = new Users_Web3Transaction(
		array(
			'chainId' => $params["chainId"],
			'transactionId' => $params["transactionId"]
		)
	);
    
    $web3Transaction->retrieve();
    
    if ($web3Transaction->status == "pending") {
		if ($params["status"] == 'mined') {
			Q_Request::requireFields(array(
				'contract',
			), true);
			
			Q::event(
				"Users/transaction/response/mined", $params["contract"]
			);
		}
		
		$web3Transaction->status = $params["status"];
		$web3Transaction->result = $params["result"];

		$web3Transaction->save(true);
    }
    
    Q_Response::setSlot("result", true);

}