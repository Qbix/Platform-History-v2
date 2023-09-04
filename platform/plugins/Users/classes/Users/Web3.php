<?php
require_once USERS_PLUGIN_DIR.'/vendor/autoload.php';
//use Web3\Web3;
//use Web3\Contract;
//use Crypto\Keccak;
//use Web3p\EthereumTx\Transaction;
//use Web3\Providers\HttpProvider;
//use Web3\RequestManagers\HttpRequestManager;
use SWeb3\SWeb3; 
use SWeb3\SWeb3_Contract;
use phpseclib\Math\BigInteger as BigNumber;

//use SWeb3\ABI; //uncomment when will ordering output p;arams
/**
 * @module Users
 */
/**
 * Class for dealing with EVM blockchains
 *
 * @class Users_Web3
 */
class Users_Web3 extends Base_Users_Web3 {
	/**
	 * Used to execute methods on the blockchain.
	 * If you don't pass privateKey, then it returns the result of a "view" operation (possibly cached locally).
	 * If you pass a privateKey, then it returns the hash of a transaction submitted to be mined.
	 * @method execute
	 * @static
	 * @param {string|array} $contractABI if an array, it is used as the ABI directly.
	 *  If it is a string under 100 characters, Users_Web3::getABI() is called to look
	 *  for the file (typically with extension abi.json) containing the JSON for the ABI.
	 * @param {string} $contractAddress the contract address to call the method on,
	 * @param {string} $methodName in the contract
	 * @param {string|array} [$params=array()] - params sent to contract method
	 * @param {string} [$appId=Q::app()] Indicate which entry in Users/apps config to use
	 * @param {boolean|null|callable} [$caching=true] Set false to ignore cache and request blockchain every time.
	 *  Set to null to cache any truthy result while not caching falsy results.
	 *  Or set to a callable function, to be passed the data as JSON, and return boolean indicating whether to cache or not.
	 * @param {integer} [$cacheDuration=3600] How many seconds in the past to look for a cache
	 * @param {integer} [$delay=0] If not found in cache, set how many microseconds to delay before querying the blockchain
	 * @param {array} [$transaction=array()] Additional information for transaction, with possible keys 'from', 'gas', 'gasPrice', 'value', 'nonce'
	 * @param {string} [$privateKey=null] Optionally pass an ECDSA private key here, to sign the transaction with (e.g. to change blockchain state).
	 * @return {mixed} Returns the transaction hash, if privateKey was specified. Otherwise, returns the (possibly cached) result of "view" operation on the blockchain.
	 */
	static function execute (
		$contractABI,
		$contractAddress,
		$methodName,
		$params = array(),
		$appId = null,
		$caching = true,
		$cacheDuration = null,
		$delay = 0,
		$transaction = array(),
		$privateKey = null)
	{
		list($appInfo, $provider, $rpcUrl) = self::objects($appId);
		if ($cacheDuration === null) {
			$cacheDuration = Q::ifset($appInfo, 'cacheDuration', 3600);
		}
		$chainId = Q::ifset($appInfo, 'chainId', Q::ifset($appInfo, 'appId', null));

		if (!$chainId) {
			throw new Q_Exception_MissingConfig(array(
				'fieldpath' => "'Users/apps/$appId/chainId'"
			));
		}
        	
        // another stupid thing 
        //      chainId should be an interger.
        //      if chainId is a hex, then in getRaw
        //      `public function getRaw(string $privateKey, int $chainId = 0):` 
        //      will transform to zero and rpc return an error with code = -32000
        //      With message: "only replay-protected (EIP-155) transactions allowed over RPC"
        if (substr($chainId, 0, 2) === '0x') {
            $chainId = hexdec($chainId);
        }

        
		if (!is_array($params)) {
			$params = array($params);
		}
		$from = Q::ifset($transaction, 'from', null);
        if ($privateKey && substr($privateKey, 0, 2) === '0x') {
            $privateKey = str_replace('0x', '', $privateKey);
        }
		
		if ($caching !== false && $cacheDuration) {
			$cache = self::getCache($chainId, $contractAddress, $methodName, $params, $cacheDuration, $from);
			if ($cache->wasRetrieved()) {
				return Q::json_decode($cache->result, true);
			}
		}
		if (is_numeric($delay) and $delay > 0) {
			usleep($delay);
		}
		
        // ability to put already decoded string like "{'a':b, ...}"
        try {
			Q::json_decode($contractABI, true);
            // $contractABI already decoded into string
		} catch (Exception $e) {
            // else try by default: 
            //  get name of file; 
            //  get content
            //  try to decode
			$contractABI_json = self::getABI($contractABI, $chainId);
            $contractABI = Q::json_encode($contractABI_json);
		}
        
		$data = array();
	
		$provider->chainId = $chainId;
		
		if (!isset($transaction['value'])) {
            $transaction['value'] = ''; // '0x0';
        }
        
        if ($privateKey) {
            $provider->setPersonalData($from, $privateKey);
        }
			
        $contract = new SWeb3_Contract($provider, $contractAddress, $contractABI);
        
		if ($privateKey) {
            if (is_array(self::$batching[$appInfo['appId']])) {
                throw new Exception("Batching signed transactions has not been supported yet.");
            }
			$extra_data = [];
            
            if (!isset($transaction['nonce'])) {

                $extra_data['nonce'] = $provider->personal->getNonce();

                // another stupid thing 
                //      Web3Contract can not understand phpseclib\Math\BigInteger with value 0x
                //      so If the value is 0 or (0x), then tx.value must be 0x0..
                $extra_data['nonce'] = self::adjustZeroHexValue($extra_data['nonce']); 
            }    
            
//			if (isset($transaction['value'])) {
//				$extra_data['value'] = ''; // '0x0';
//			}

			$result = $contract->send($methodName, $params, $extra_data);
            
		} else {
            $result = $contract->call($methodName, $params);
        }
        
        if (count($result) == 0) {
			return null;
		}
        
        // if in batching mode, we just push into queue list (self::$batching)
        // and return number of transaction of our list.
		if (is_array(self::$batching[$appInfo['appId']])) {
			array_push(self::$batching[$appInfo['appId']], array($contract, $methodName, ($privateKey ? true : false), $callback));
			return count(self::$batching[$appInfo['appId']]) - 1;
		}
        
        // if not batch then we expect a result
        // so just need to adjust returned data

        $data = self::adjust($result);
        
        // cache manipulation
		if ((
			is_callable($caching)
			and call_user_func_array($caching, array($data))
		) or (
			($data && $caching !== false)
			or (!$data && $caching === true)
		)) {
			if (!$cache->wasRetrieved()) {
				$cache->result = Q::json_encode($data);
			}
			$cache->save(true); // each time it updates updatedTime
		}
        
		return $data;

	}
    
    /**
	 * getTransactionReceipt
	 * @method getTransactionReceipt
	 * @static
     * @param appId
	 * @param {string|array} transaction hash or response that returned by execute
     * @param attempts maximum attempt to get receipt
     * @param delay delay in microseconds between attempts
	 */
    static function getTransactionReceipt($appId, $response, $attempts, $delay)
    {  
        list($appInfo, $provider, $rpcUrl) = self::objects($appId);
        $transaction_hash = (is_array($response) && isset($response['result']))
            ?
            $response['result']
            :
            $response
            ;
        $result = null;
        $count = 0;
        while ($count < $attempts) {
            if ($count != 0) {usleep($delay);}
            try {
                $result = $provider->getTransactionReceipt($transaction_hash);
                break;
            } catch (Exception $ex) {

            }
        }
        return $result;
//        $result = $this->call('eth_getTransactionReceipt', [$transaction_hash]); 
// 
//        if(!isset($result->result)) {
//            throw new Exception('getTransactionReceipt error: ' . json_encode($result));   
//        }
//
//        return $result;
    }
    
    static function isTransactionMined($receipt) {
        $receipt = (($receipt instanceof stdClass) && isset($receipt->result))
            ?
            $receipt->result
            :
            $receipt
            ;
        if ($receipt->status == '0x1') {
            return true;
        }
        return false;
    }

	/**
	 * Start a batch, then call execute() method multiple times with same $appId,
	 * and finally call batchExecute($callback, $appId)
	 * @method batchStart
	 * @static
	 * @param {string} [$appId=Q::app()] Indicate which entry in Users/apps config to use
	 */
	static function batchStart($appId = null)
	{
        
		list($appInfo, $provider, $rpcUrl) = self::objects($appId);
		$provider->batch(true);
         // [appId] => 0x13881
		self::$batching[$appInfo['appId']] = array();
        
	}

	/**
	 * Start a batch, then call execute() method multiple times with same $appId,
	 * and finally call batchExecute($appId)
	 * @method batchExecute
	 * @static
	 * @param {string} [$appId=Q::app()] Indicate which entry in Users/apps config to use
	 */
	static function batchExecute($appId = null, &$batchResults = null)
	{

		$err = null;
		$data = [];
		list($appInfo, $provider, $rpcUrl) = self::objects($appId);

		$results = $provider->executeBatch();
        if (count($results) == 0) {
			throw new Q_Exception($err);
		}
        $batchResults = $results;
        
		foreach ($results as $index=>$result) {
            // !!! not $result->id
            // id in rpc reseponce is the same for all reqeuests on batch request. because batch request the single 
			list($contract, $methodName, $signedTx, $callable) = self::$batching[$appInfo['appId']][$index];
            if ($signedTx) {
                $data[$index] = $results[$index]->result;
            } else {
                $data[$index] = self::adjust($contract->DecodeData($methodName, $results[$index]->result));
            }
			
			//call_user_func($callable, $data[$index], $index);
		}
		self::$batching[$appInfo['appId']] = null;
        $extra_curl_params = [];
        $extra_header_params = [];
		self::$providers[$rpcUrl] = new SWeb3($rpcUrl, $extra_curl_params, $extra_header_params);
        $provider->batch(false);
		if ($err) {
			throw new Q_Exception($err);
		}
		return $data;
	}
    
    //function getGasPrice(bool $force_refresh = false) : BigNumber 
        
    static function _adjust($in) 
    {
        if ($in instanceof phpseclib\Math\BigInteger) {
            return $in->toString();
        } else if (is_string($in) && $in == '0x') {
            return '0x0000000000000000000000000000000000000000';
        } else {
            return $in;
        }
    }
    static function adjust($in)
    {
        $out = null;
//echo 'static function adjust($in)' . PHP_EOL;
//print_r($in);
        if ($in instanceof stdClass) {
            
            $out = [];
            foreach ($in as $k => $v) {
                
//echo "k = $k" . PHP_EOL;
                if ((is_string($k) && substr($k, 0, 5) == 'tuple') || ($v instanceof stdClass)) {
//
//echo "if (is_string(k) && substr(k, 0, 5) == 'tuple') {" . PHP_EOL;
//print_r($v);
                    $out[$k] = self::adjust($v);
                } else if (is_array($v)) {
                    $tmp2 = [];
                    foreach ($v as $k2 => $v2) {
                        $tmp2[$k2] = self::adjust($v2);
                    }
                    $out[$k] = $tmp2;
                } else {
                    
                    $out[$k] = self::_adjust($v);
                } 
            }
            if (count($out) == 1) {
                $out = $out[array_key_first($out)];
            }
            return $out;
        
        } else {
            return self::_adjust($in);
        }
    }

	/**
	 * Get existing provider object, or create a new one
	 * @method objects
	 * @static
	 * @param
	 * @return {array} array($appInfo, $provider, $rpcUrl)
	 */
	static function objects($appId = null)
	{
		if (!isset($appId)) {
			$appId = Q::app();
		}
		$usersWeb3Config = Q_Config::get("Users", "web3", "chains", $appId, array());

		list($appId, $appInfo) = Users::appInfo('web3', $appId, true);
		$appInfo = array_merge($usersWeb3Config, $appInfo);
		$chainId = Q::ifset($appInfo, 'chainId', Q::ifset($appInfo, 'appId', null));
		if (!$chainId) {
			throw new Q_Exception_MissingConfig(array(
				'fieldpath' => "'Users/apps/web3/$appId/chainId'"
			));
		}
		if (empty($appInfo['rpcUrl'])) {
			throw new Q_Exception_MissingConfig(array(
				'fieldpath' => "Users/apps/web3/$appId/rpcUrl"
			));
		}
		$infuraKey = $infuraId = Q::ifset(
			$appInfo, 'providers', 'walletconnect', 'infura', 'projectId',
			Q::ifset($appInfo, 'infura', 'key', null)
		);
		$rpcUrl = Q::interpolate($appInfo['rpcUrl'], compact('infuraId', 'infuraKey'));
		if (preg_match('/^https?:\/\//', $rpcUrl) === 1) {
			if (empty(self::$providers[$rpcUrl])) {
                // extra curl params
                $extra_curl_params = [];
                // $extra_curl_params[CURLOPT_USERPWD] = ':'.INFURA_PROJECT_SECRET;                
                $extra_header_params = [];
				self::$providers[$rpcUrl] = new SWeb3($rpcUrl,$extra_curl_params, $extra_header_params);
			}
			$provider = self::$providers[$rpcUrl];
		} else {
			$provider = null;
		}
		return array($appInfo, $provider, $rpcUrl);
	}

	/**
	 * Get available Web3 chains information (contact address, currency, rpcUrl, blockExplorerUrl)
	 * for functions like Q.Users.Web3.switchChain().
	 * @method getChains
	 * @param {string} [$needChainId] if defined return only this chain info
	 * @static
	 * @return array
	 */
	static function getChains($needChainId = null)
	{
		$chains = Q_Config::get("Users", "apps", "web3", array());
		$result = array();
		$defaultAppId = Q_Config::get('Users', 'apps', 'defaultApps', 'web3', Q::app());
		foreach ($chains as $i => $chain) {
			$chainId = Q::ifset($chain, 'chainId', Q::ifset($chain, 'appId', null));
			if (!$chainId or ($needChainId && $chainId != $needChainId)) {
				continue;
			}

			$name = Q::ifset($chain, "name", null);
			$default = ($i == $defaultAppId);
			$usersWeb3Config = Q_Config::get("Users", "web3", "chains", $chainId, null);
			$rpcUrl = Q::ifset($chain, "rpcUrl", Q::ifset($usersWeb3Config, "rpcUrl", null));
			$infuraId = Q::ifset(
				$chain, "providers", "walletconnect", "infura", "projectId",
				Q::ifset($chain,"infura", "projectId", null)
			);
			$blockExplorerUrl = Q::ifset($chain, "blockExplorerUrl", Q::ifset($usersWeb3Config, "blockExplorerUrl", null));
			$abiUrl = Q::ifset($chain, "abiUrl", Q::ifset($usersWeb3Config, "abiUrl", null));

			if (!$rpcUrl) {
				continue;
			}
			$rpcUrl = Q::interpolate($rpcUrl, compact("infuraId"));
			$rpcUrls = array($rpcUrl);
			$blockExplorerUrls = array($blockExplorerUrl);
			$temp = compact("name", "chainId", "default", "rpcUrls", "blockExplorerUrls", "abiUrl");
			if ($needChainId && $chainId == $needChainId) {
				return $temp;
			}
			$result[$chainId] = $temp;
		}
		return $result;
	}

	/**
	 * Get available Web3 factories information
	 * @method getContracts
	 * @param {string} [$needChainId] if defined return only this chain info
	 * @static
	 * @return array
	 */
	static function getContracts()
	{
		return Q_Config::get('Users', 'web3', 'contracts', array());
	}

	/**
	 * Get content of the ABI file for a contract.
	 * Taken from config Users/web3/contracts/$contractName/filename.
	 * As a fallback tries config Users/web3/contracts/$contractName/dir and if found,
	 * appends "/$contractAddress.json". As a last resort, tries
	 * Users/web3/contracts/$contractName/url and downloads it from that URL.
	 * You can interpolate "baseUrl" and "contractAddress" variables in the strings.
	 * 
	 * @method getABI
	 * @static
	 * @param {string} $name - The name of the template in the views folder, e.g. "Module/templates/factory"
	 *   and it will load a file like "views/Module/templates/factory.abi.json"
	 * @param {Boolean} [$throwIfNotFound=true] - If true, throw exception if ABI file not found.
	 * @return {array|null} Tries filename, then $dir/$contractAddress.json, then url from config
	 */
	static function getABI ($name, $throwIfNotFound=true)
	{
		/**
		 * @event Users/Web3/getABI {before}
		 * @param {string} $name
		 * @param {boolean} $throwIfNotFound
		 * @return {array|null} the actual ABI (decoded from JSON content)
		 */
		Q::event(
			'Users/Web3/getABI', compact('name', 'throwIfNotFound'),
			'before', false, $ABI
		);
		if ($ABI) {
			return $ABI;
		}

		if (substr($name, -9) !== '.abi.json') {
			$name .= '.abi.json';
		}
		$contents = Q::view($name);
		if (!$contents) {
			if ($throwIfNotFound) {
				throw new Q_Exception_MissingFile(array(
					'filename' => "views/$name"
				));
			}
			return null;
		}
		
		try {
			$ABI = Q::json_decode($contents, true);
		} catch (Exception $e) {
			if ($throwIfNotFound) {
				throw new Q_Exception_BadValue(array(
					'internal' => 'ABI file content',
					'problem' => 'Invalid JSON'
				));
			}
			return null;
		}
		return $ABI;
	}

	/**
	 * See if there is a cache that is at most cacheDuration seconds old,
	 * for the given query on the given chain
	 * @method getCache
	 * @static
	 * @param {String} $chainId
	 * @param {String} $contract - smart contract address
	 * @param {String} $methodName
	 * @param {String} $params params used to call the method
	 * @param {integer} [$cacheDuration=3600] Don't return cache if it's older than this many seconds
	 * @param {String} [$fromAddress=null] If there is a specific address to make the request as, pass it here
	 * @return {Db_Row}
	 */
	static function getCache (
		$chainId,
		$contract,
		$methodName, 
		$params, 
		$cacheDuration=null,
		$fromAddress=null)
	{
		if ($cacheDuration === null) {
			$cacheDuration = Q::ifset($appInfo, 'cacheDuration', 3600);
		}

		if (!is_array($params)) {
			$params = array($params);
		}

		$cached = new Users_Web3(array(
			'chainId' => $chainId,
			'contract' => $contract,
			'methodName' => $methodName,
			'params' => Q::json_encode($params),
			'fromAddress' => ($fromAddress ? $fromAddress : ''),
			'updatedTime' => new Db_Range(
				new Db_Expression("CURRENT_TIMESTAMP - INTERVAL $cacheDuration SECOND"),
				false,
				true,
				new Db_Expression('CURRENT_TIMESTAMP')
			)
		));
		$cached->retrieve();
		return $cached;
	}

	/**
	 * Get wallet address by user ID
	 * @method getWalletByUserId
	 * @static
	 * @param {String} [$userId] - If empty, logged in userId used
	 * @param {Boolean} [$throwIfNotFound=false] - If true, throw exception if wallet addres not found
	 * @return {String|null}
	 */
	static function getWalletByUserId ($userId=null, $throwIfNotFound=false) {
		$userId = $userId ? $userId : Users::loggedInUser(true)->id;
		$usersExternalTo = Users_ExternalTo::select()->where(array(
			"platform" => "web3",
			"appId" => "all",
			"userId" => $userId
		))->fetchDbRow();
		if ($usersExternalTo) {
			return $usersExternalTo->xid;
		}
		if ($throwIfNotFound) {
			throw new Exception("Wallet address not found");
		}
		return null;
	}

	/**
	 * Get user ID by wallet address
	 * @method getUserIdByWallet
	 * @static
	 * @param {String} $wallet - wallet address
	 * @param {Boolean} [$throwIfNotFound=false] If true, throw exception if wallet addres not found
	 * @return {String|null}
	 */
	static function getUserIdByWallet ($wallet, $throwIfNotFound=false) {
		$usersExternalFrom = Users_ExternalFrom::select()->where(array(
			"platform" => "web3",
			"appId" => "all",
			"xid" => strtolower($wallet)
		))->fetchDbRow();
		if ($usersExternalFrom) {
			return $usersExternalFrom->userId;
		}
		if ($throwIfNotFound) {
			throw new Exception("Users::getUserIdByWallet: User ID not found");
		}
		return null;
	}

	/**
	 * Check whether an event or function is defined in the ABI
	 * @method existsInABI
	 * @static
	 * @param {String} $name - The name of method or event
	 * @param {array} $ABI - ABI structure
	 * @param {string} [$type] - The type of item. Can be "event" or "function".
	 * @param {Boolean} [$throwIfNotFound=false] If true, throw exception if wallet addres not found
	 * @return {String|null}
	 */
	static function existsInABI ($name, $ABI, $type="function", $throwIfNotFound=false) {
		foreach ($ABI as $item) {
			if (Q::ifset($item, "type", null) == $type && Q::ifset($item, "name", null) == $name) {
				return true;
			}
		}

		if ($throwIfNotFound) {
			throw new Exception(Q::interpolate('{{type}} "{{name}}" not found in contract"', compact("name", "type")));
		}

		return false;
	}

	/**
	 * Check if string is valid Ethereum address
	 * this method created on the basis https://stackoverflow.com/questions/44990408/how-to-validate-ethereum-addresses-in-php
	 * @method isValidAddress
	 * @static
	 * @param {String} $address
	 * @param {string} [$normalized=null] Will be filled with the address string if valid.
	 * This var need for compatibility with Q_Valid methods.
	 * @return {Boolean}
	 */
	static function isValidAddress ($address, &$normalized=null) {
		// check if matches pattern
		if (!preg_match('/^(0x)?[0-9a-f]{40}$/i', $address)) {
			return false;
		}

		// check if all same caps
		if (preg_match('/^(0x)?[0-9a-f]{40}$/', $address) || preg_match('/^(0x)?[0-9A-F]{40}$/', $address)) {
			$normalized = $address;
			return true;
		}

		// check valid valid checksum
		$address = str_replace('0x', '', $address);
		$addressArray = str_split($address);
		$hash = Keccak::hash(strtolower($address), 256);
		$hashArray = str_split($hash);

		// See: https://github.com/web3j/web3j/pull/134/files#diff-db8702981afff54d3de6a913f13b7be4R42
		for ($i = 0; $i < 40; $i++ ) {
			if (ctype_alpha($addressArray[$i])) {
				// Each uppercase letter should correlate with a first bit of 1 in the hash char with the same index,
				// and each lowercase letter with a 0 bit.
				$charInt = intval($hashArray[$i], 16);

				if ((ctype_upper($addressArray[$i]) && $charInt <= 7) || (ctype_lower($addressArray[$i]) && $charInt > 7)) {
					return false;
				}
			}
		}

		$normalized = $address;
		return true;
	}
    
    /**
	 * Used to transform '0' or '0x' values to 0x0.
	 
	 * @method adjustZeroHexValue
	 * @static
	 * @param {string|object} $in 
	 * @return {string} 
	 */
    static function adjustZeroHexValue($in) {
        return (in_array($in.'', array('0', '0x'))) ? '0x0' : $in; 
    }

	public static $providers = array();
	public static $batching = array();
};
