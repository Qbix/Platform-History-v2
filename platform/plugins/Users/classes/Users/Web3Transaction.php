<?php

use SWeb3\SWeb3; 

/**
 * @module Users
 */
/**
 * Class representing 'Web3Transaction' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a web3 transaction row in the Users database.
 *
 * @class Users_Web3Transaction
 * @extends Base_Users_Web3Transaction
 */
class Users_Web3Transaction extends Base_Users_Web3Transaction
{
	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	function setUp()
	{
		parent::setUp();
	}

	/**
	 * Analyze input and generate a Users_Web3Transaction object from it
	 * @method createFromInput
	 * @static
	 * @param {array} [$input=$_REQUEST] You can pass a different payload here.
	 *  By default, it looks at the $_REQUEST array
	 * @param {string} [$asXid] If not passed, expects web3_all xid of logged-in user
	 */
	static function createFromInput($input = null, $asXid = null)
	{
		if (!isset($input)) {
			$input = $_REQUEST;
		}
		
		$requiredFields = array('chainId', 'transactionId', 'payload', 'signature');
		Q_Valid::requireFields($requiredFields, $payload, true);
		$payload = $input['payload'];
		$signature = $input['signature'];
		// // TODO: require the litearl transaction payload with nonce, that was signed
		// $e = new Crypto\EthSigRecover();
		// $fromAddress = strtolower(
		// 	$e->personal_ecRecover($payload, $signature)
		// );

		// if (empty($asXid)) {
		// 	$user = Users::loggedInUser(true);
		// 	$asXid = $user->getXid('web3_all');
		// 	if (!$asXid) {
		// 		throw new Q_Exception_MissingObject(array('object' => 'logged-in user xid'));
		// 	}
		// }
		// if (strtolower($asXid) !== strtolower($this->fromAddress)) {
		// 	throw new Q_Exception_WrongValue(array(
		// 		'field' => 'asXid',
		// 		'range' => $this->fromAddress,
		// 		'value' => $asXid
		// 	));
		// }


		// TODO: save these optional parameters if they come from $input
		// We will just have to trust the user input here
		// `contract` varchar(42) NOT NULL DEFAULT '',
		// `methodName` varchar(63) NOT NULL DEFAULT '',
		// `params` varchar(1023) NOT NULL DEFAULT '',
		// `fromAddress` varchar(100) NOT NULL,
		// `userId` varbinary(31) NOT NULL,
		// `extra` varbinary(1023) DEFAULT '',
		// `result` text,

		$status = 'pending'; // don't bother checking blockchain, assume pending?
		$userId = ($user = Users::loggedInUser() ? $user->id : null);
		$fields = compact(
			'chainId', 'transactionId', 'fromAddress', 'status', 'userId'
		);
		Q::take($input, array('contract', 'methodName', 'params', 'extra'), $fields);
		return new Users_Web3Transaction($fields);
	}

	/**
	 * Get the transaction receipt corresponding to this transaction
	 * on its chain
	 * @method getReceipt
	 * @return {array|null} See https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_gettransactionreceipt
	 */
	function getReceipt()
	{
		list($appInfo, $provider, $rpcUrl) = Users_Web3::objects($this->chainId);
		$web3 = new SWeb3($provider);
		return $web3->getTransactionReceipt($this->transactionId);
	}

	/**
	 * Check the transaction receipt, and take action if status changed
	 * @method 
	 * @return {boolean} Whether the handler was called
	 */
	function handleStatusUpdate()
	{
		$result = $this->getReceipt();
		$this->retrieve(null, false, array(
			'begin' => true,
			'ignoreCache' => true
		));
		if ($this->status !== 'pending' // wasn't pending anymore
			|| !$result                 // wasn't mined yet
			|| !$result['status']       // transaction was reverted
		) {
			return false;
		}
		// TODO: save some JSON representation of result of transaction in $this->result
		$eventName = "Users/web3/transaction/" . $this->method;
		Q::event($eventName, array('transaction' => $this), true);
		$this->status = 'mined';
		$this->save(false, true);
		return true;
	}

	/**
	 * Returns whether transaction status is mined or confirmed
	 * @method wasMined
	 * @return {boolean}
	 */
	function wasMined()
	{
		return in_array($this->status, array('mined', 'confirmed'));
	}

	/**
	 * Returns whether transaction status is pending, mined or confirmed
	 * @method wasPosted
	 * @return {boolean}
	 */
	function wasPosted()
	{
		return in_array($this->status, array('pending', 'mined', 'confirmed'));
	}
	
	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Users_Web3Transaction} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Users_Web3Transaction();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};