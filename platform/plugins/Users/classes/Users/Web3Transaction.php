<?php
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
	 * Updates the transaction status after fetching blockchain receipt
	 * @method fetchReceipt
	 * @static
     * @param {string} $appId
	 * @param {string} $transactionId transaction hash or response that returned by execute
	 * @param {array} [$options]
     * @param {integer} [$options.attempts=1] maximum attempt to get receipt
     * @param {integer} [$options.delay=1000] delay in microseconds between attempts
	 * @return {boolean} whether the Web3_Transaction was updated and should be saved
	 */
	function updateFromBlockchainReceipt($options = array())
	{
		$receipt = self::fetchBlockchainReceipt($this->chainId, $this->transactionId, $options);
		if (Users_Web3Transaction::isMined($receipt)) {
			$this->status = 'mined';
			$this->result = Q::json_encode($receipt);
			//TODO 0: extract reverted from receipt and save $this->reverted
			return true;
		}
		return false;
	}

	/**
	 * Gets the receipt of a transaction submitted to the blockchain
	 * @method fetchReceipt
	 * @static
     * @param {string} $appId
	 * @param {string} $transactionId transaction hash or response that returned by execute
	 * @param {array} [$options]
     * @param {integer} [$options.attempts=1] maximum attempt to get receipt
     * @param {integer} [$options.delay=1000] delay in microseconds between attempts
	 * @return {StdClass} see https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_gettransactionreceipt
	 */
    static function fetchBlockchainReceipt($appId, $transactionId, $options = array())
    {  
        list($appInfo, $provider, $rpcUrl) = Users_Web3::objects($appId);
        $result = null;
		$attempts = Q::ifset($options, 'attempts', 1);
		$delay = Q::ifset($options, 'delay', 1);
		for ($count = 0; $count < $attempts; ++$count) {
            if ($delay > 0) {
				usleep($delay);
			}
			$result = $provider->getTransactionReceipt($transactionId);
			break;
        }
		if (empty($result->result)) {
			throw new Users_Exception_Web3Fetch(array('error' => $result));
		}
        return $result->result;
    }
    
	/**
	 * Gets the receipt of a transaction submitted to the blockchain
	 * @method isMined
	 * @static
     * @param {array} receipt
	 * @return {boolean}
	 */
    static function isMined($receipt) {
        $receipt = (($receipt instanceof stdClass) && isset($receipt->result))
            ? $receipt->result
            : $receipt;
        return ($receipt->status == '0x1');
    }

		/**
	 * @method getAllExtras
	 * @return {array} The array of all extras set in the stream
	 */
	function getAllExtras()
	{
		return empty($this->extra) 
			? array()
			: json_decode($this->extra, true);
	}
	
	/**
	 * @method getExtra
	 * @param {string} $extraName The name of the extra to get
	 * @param {mixed} $default The value to return if the extra is missing
	 * @return {mixed} The value of the extra, or the default value, or null
	 */
	function getExtra($extraName, $default = null)
	{
		$attr = $this->getAllExtras();
		return isset($attr[$extraName]) ? $attr[$extraName] : $default;
	}
	
	/**
	 * @method setExtra
	 * @param {string} $extraName The name of the extra to set,
	 *  or an array of $extraName => $extraValue pairs
	 * @param {mixed} $value The value to set the extra to
	 * @return Streams_RelatedTo
	 */
	function setExtra($extraName, $value = null)
	{
		$attr = $this->getAllExtras();
		if (is_array($extraName)) {
			foreach ($extraName as $k => $v) {
				$attr[$k] = $v;
			}
		} else {
			$attr[$extraName] = $value;
		}
		$this->extra = Q::json_encode($attr);

		return $this;
	}
	
	/**
	 * @method clearExtra
	 * @param {string} $extraName The name of the extra to remove
	 */
	function clearExtra($extraName)
	{
		$attr = $this->getAllExtras();
		unset($attr[$extraName]);
		$this->extra = Q::json_encode($attr);
	}
	
	/**
	 * @method clearAllExtras
	 */
	function clearAllExtras()
	{
		$this->extra = '{}';
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