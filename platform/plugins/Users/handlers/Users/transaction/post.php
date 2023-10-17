<?php
/**
 * Any logged-in user can call this method to store in the database
 * a Web3 transaction that they signed. We accept any transaction but
 * impose a quota on each user.
 * @class HTTP Users transaction
 * @method POST
 * @param $params 
 * @param {string} $params.chainId Required, chain id 
 * @param {string} $params.transactionId Required, transaction hash. In the future, by this hash we will determine is transaction mined or not
 * @param {string} $params.fromAddress Required, address which initiated transaction
 * @param {string} $params.methodName Required, method name in contract
 * @param {string} $params.params Required, JSON of parameters of method name. if parameters are empty should be "()" or smth like that
 * @param {string} $params.contract Required, contract's address which initiated transaction 
 * @param {string} [$params.extra] JSON-encoded string containins any extra parameters to store in the transaction,
 *   and to be used in Users/transaction/mined/... hooks
 * @return void
 */
function Users_transaction_post($params)
{
	// TODO:
	// 1) require "raw" parameter from transaction.raw in ethers.js
	// 2) use Crypto\EthSigRecover() and recover signer from signature
	// 3) require that user->getXid('web3_all') matches it
	// 4) check if transactionId to have been posted to the blockchain (use Users_Web3 as a cache)
	// 5) if yes, put "pending" status, otherwise put "signed" status.

    $user = Users::loggedInUser(true);
    $request = array_merge($params, $_REQUEST);
    
	$quota = Users_Quota::check($user->id, '', 'Users/transaction/post');

	$requiredFields = array(
		'chainId', 'transactionId', 
		'contractABIName', 'fromAddress', 'methodName', 'params',
		'contract'
	);
	Q_Request::requireFields($requiredFields, true);

	$fields = Q::take($request, compact('chainId', 'transactionId'));
	$web3Transaction = new Users_Web3Transaction($fields);
    if ($web3Transaction->retrieve()) {
		throw new Q_Exception_AlreadyExists(array('source' => 'transaction'));
	}

	foreach ($requiredFields as $f) {
		$web3Transaction->$f = $request[$f];
	}
	
	if ($request['communityId']) {
		$web3Transaction->setExtra('communityId', $request['communityId']);
	}
	$web3Transaction->userId = $user->id;
    
	$web3Transaction->status = 'pending';
    $web3Transaction->save();
	$quota->used(1);
    
    Q_Response::setSlot("result", true);

}