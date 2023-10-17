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
    
    $params = array_merge($params, $_REQUEST);
    
	Q_Request::requireFields(array(
		'chainId', 
		'transactionId',
		'status',
		'result'
	), true);

	$fields = Q::take($params, array('chainId', 'transactionId'));
	$web3Transaction = new Users_Web3Transaction($fields);
    if (!$web3Transaction->retrieve()) {
		throw new Q_Exception_MissingObject(array('name' => 'transaction'));
	}
    
    if ($web3Transaction->status == "pending"
	&& $params["status"] == 'mined') {
		// double-check that it was actually mined
		// using up to 3 attempts separated by 1 second
		$attempts = Q_Config::get('Users', 'web3', 'transactions', 'receipt', 'attempts', 3);
		if ($web3Transaction->updateFromBlockchainReceipt(compact('attempts'))) {
			$web3Transaction->save(true);
		}
//		if (empty($web3Transaction->contract)) {
//			throw new Q_Exception_MissingObject(array('name' => 'transaction->contract'));
//		}
		
		// the code below are fixes on Greg's changes
		// 1. $transaction->contract != $params['contract'] 
		//	the first is about contract that we initiated transaction,
		//  but the second is what we need. it's address of instsance which created after calling produce and grab from solidity event
		// 2. 
		if (empty($params["contract"])) {
			throw new Q_Exception(array('name' => 'contract'));
		} else {
//			$transaction = $params['transaction'];
//			$communityId = $transaction->getExtra('communityId');
//			$contract = $params['contract'];

			$externalTo = new Users_ExternalTo();
			$externalTo->userId   = $params['communityId'];
			$externalTo->platform = 'web3';
			$externalTo->appId    = $params['chainId'];
			$data = $externalTo->retrieve();

			if (!$data->xid) {
				$user = Users::fetch($params['communityId'], true);
				$user->setXid("web3_{$params['chainId']}", $params['contract']);
				$user->save();

				$externalTo->xid = $params['contract'];
				$externalTo->save(true); // this also saves externalTo
			}
		}
		// ask Greg why and how we wil be descrypt instance address from event 
		//		inside transaction_mined and update ExternalTo
//		Q::event("Users/transaction/mined", array(
//			'transaction' => $web3Transaction
//		));
    }
    
    Q_Response::setSlot("result", true);

}