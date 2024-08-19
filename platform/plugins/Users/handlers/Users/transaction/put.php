<?php
/**
 * Used to update transaction status(and created instance) on database
 * call by user(owners) or by cron-job so $params $_REQUEST will be merged
 * @class HTTP Users transaction
 * @method PUT
 * @param $params 
 * @param {string} $params.chainId Required, chain id 
 * @param {string} $params.transactionId Required, transaction hash. In the future, by this hash we will determine is transaction mined or not
 * @param {string} $params.status Required, status of transaction. can be 'mined'
 * @param {string} $params.result optional, result of receipt transaction. output of JSON-RPC `eth_getTransaction`
 * @param {string} $params.contract Required if $params["status"] == 'mined', address of created instance
 * @param {string} [$params.communityId] Defaults to Users::currentCommunityId
 * @return void
 */
function Users_transaction_put($params)
{
    if (empty($params) && empty(Users::roles(null, array('Users/owners')))) {
		throw new Users_Exception_NotAuthorized();
    }
	$user = Users::loggedInUser(true);
    $quota = Users_Quota::check($user->id, '', 'Users/web3/transaction');
	
    $params = array_merge($params, $_REQUEST);
    
	Q_Valid::requireFields(array(
		'chainId', 
		'transactionId',
		'status',
		'contract'
	), $params, true);

	$fields = Q::take($params, array('chainId', 'transactionId'));
	$transaction = new Users_Web3Transaction($fields);
    if (!$transaction->retrieve()) {
		throw new Q_Exception_MissingObject(array('name' => 'transaction'));
	}
	
    if ($transaction->status == "pending"
	&& $params["status"] == 'mined') {
		
		// double-check that it was actually mined
		// using up to 3 attempts separated by 1 second
		$attempts = Q_Config::get('Users', 'web3', 'transactions', 'receipt', 'attempts', 3);
		if (!$transaction->updateFromBlockchainReceipt(compact('attempts'))) {
			throw new Q_Exception_AttemptsExceeded();
		}
		
//		if (empty($transaction->contract)) {
//			throw new Q_Exception_MissingObject(array('name' => 'transaction->contract'));
//		}
		$contract = $params['contract'];
		$chainId = $params['chainId'];
		$communityId = $params['communityId'];
		if (!empty($transaction->contractABIName)) {
			Q::event("Users/transaction/mined/"
				. $transaction->contractABIName . '/'
				. $transaction->methodName,
				compact('transaction', 'contract', 'chainId', 'communityId'),
				'after'
			);
		}

		$transaction->save(true);

		// WARNING: not recommended to add hooks with these names,
		// since the same method name might be shared
		// among multiple types of smart contracts
//		Q::event("Users/transaction/mined/"
//			. $transaction->methodName,
//			compact('transaction', 'contract'),
//			'after'
//		);
		
    }

	$quota->used(1);
    
    Q_Response::setSlot("result", true);

}