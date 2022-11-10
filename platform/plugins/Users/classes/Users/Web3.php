<?php
require_once USERS_PLUGIN_DIR.'/vendor/autoload.php';
use Web3\Web3;
use Web3\Contract;
use Crypto\Keccak;
use Web3p\EthereumTx\Transaction;

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
	 * @param {string} [$appId=Q::app()] Indicate which entery in Users/apps config to use
	 * @param {boolean|null|callable} [$caching=true] Set false to ignore cache and request blockchain every time.
	 *  Set to null to cache any truthy result while not caching falsy results.
	 *  Or set to a callable function, to be passed the data as JSON, and return boolean indicating whether to cache or not.
	 * @param {integer} [$cacheDuration=3600] How many seconds in the past to look for a cache
	 * @param {string} [$defaultBlock='latest'] Can be one of 'latest', 'earliest', 'pending'
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
		$defaultBlock = 'latest',
		$delay = 0,
		$transaction = array(),
		$privateKey = null)
	{
		if (!isset($appId)) {
			$appId = Q::app();
		}

		$usersWeb3Config = Q_Config::get("Users", "web3", "chains", $appId, array());
		list($appId, $appInfo) = Users::appInfo('web3', $appId, true);
		$appInfo = array_merge($usersWeb3Config, $appInfo);
		if ($cacheDuration === null) {
			$cacheDuration = Q::ifset($appInfo, 'cacheDuration', 3600);
		}

		$chainId = Q::ifset($appInfo, 'chainId', Q::ifset($appInfo, 'appId', null));
		if (!$chainId) {
			throw new Q_Exception_MissingConfig(array(
				'fieldpath' => "'Users/apps/$appId/chainId'"
			));
		}

		if (!is_array($params)) {
			$params = array($params);
		}

		$from = Q::ifset($transaction, 'from', null);
		$cache = self::getCache($chainId, $contractAddress, $methodName, $params, $cacheDuration, $from);
		if ($caching !== false && $cacheDuration && $cache->wasRetrieved()) {
			return Q::json_decode($cache->result);
		}

		if ($delay) {
			usleep($delay);
		}

		if (empty($appInfo['rpcUrl'])) {
			throw new Q_Exception_MissingConfig(array(
				'fieldpath' => "Users/apps/$appId/rpcUrl"
			));
		}
		$infuraId = Q::ifset(
			$appInfo, 'providers', 'walletconnect', 'infura', 'projectId', null
		);
		$rpcUrl = Q::interpolate(
			$appInfo['rpcUrl'],
			compact('infuraId')
		);

		$contractABI = self::getABI($contractABI, $chainId);
		$data = array();
		$arguments = array($methodName);
		foreach ($params as $param) {
			$arguments[] = $param;
		}
		$callback = function ($err, $results) use (&$data) {
			if ($err) {
				$errMessage = Q::ifset($err, "message", null);
				if (!$errMessage) {
					$errMessage = $err->getMessage();
				}
				if ($errMessage) {
					throw new Exception($errMessage);
				}
			}

			if (empty($results)) {
				$data = $results;
				return;
			}
			if (sizeof($results) == 1) {
				$value = reset($results);
				if (is_array($value)) {
					foreach ($value as $result) {
						$data[] = $result->toString();
					}
				} else {
					$data = $value;
				}
			} else {
				$data = $results;
			}
		};

		$contract = (new Contract($rpcUrl, $contractABI, $defaultBlock))
			->at($contractAddress);
		if ($privateKey) {
			if (empty($transaction['from'])) {
				throw new Q_Exception_MissingObject(array(
					'name' => 'transaction.from'
				));
			}
			$eth = $contract->getEth();
			$rawTransactionData = '0x' . 
				call_user_func_array([$contract, "getData"], $arguments);
			$transactionCount = null;
			$eth->getTransactionCount($transaction['from'],
			function ($err, $count) use(&$transactionCount) {
				if ($err) { 
					throw new Q_Exception('transaction count error: ' . $err->getMessage());
				}
				$transactionCount = $count;
			});
			if (!isset($transactionCount)) {
				return null;
			}
			$transactionParams = array_merge(array(
				'nonce' => "0x" . dechex($transactionCount->toString()),
				'from' => $transaction['from'],
				'to' =>  $contractAddress,
				// 'gas' =>  '0x' . dechex(8000000),
				'value' => '0x0',
				'data' => $rawTransactionData
			), $transaction);
			if (empty($transactionParams['gas'])) {
				$estimatedGas = null;
				$contract->estimateGas($transactionParams,
				function ($err, $gas) use (&$estimatedGas) {
					if ($err) {
						throw new Q_Exception('estimate gas error: ' . $err->getMessage());
					}
					$estimatedGas = $gas;
				});
				$transactionParams['gas'] = $estimatedGas;
			}
			$tx = new Transaction($transactionParams);
			$signedTx = '0x' . $tx->sign($privateKey);
			$transactionHash = null;
			$eth->sendRawTransaction($signedTx,
			function ($err, $txHash) use (&$transactionHash) {
				if ($err) { 
					throw new Q_Exception('transaction error: ' . $err->getMessage());
				} else {
					$transactionHash = $txHash;
				}
			});
			// NOTE: This hasn't been tested yet
			return $transactionHash;
		}
		$arguments[] = $transaction;
		$arguments[] = $defaultBlock;
		$arguments[] = $callback;
		// call contract function
		
		call_user_func_array([$contract, "call"], $arguments);

		if ($data instanceof \phpseclib\Math\BigInteger) {
			$data = $data->toString();
		} elseif (is_array($data)) {
			foreach ($data as $key => $item) {
				if ($item instanceof \phpseclib\Math\BigInteger) {
					$data[$key] = $item->toString();
				}
			}
		}

		if ($cache) {
			if ((
				is_callable($caching)
				and call_user_func_array($caching, array($data))
			) or (
				($data && $caching !== false)
				or (!$data && $caching === true)
			)) {
				$cache->result = Q::json_encode($data);
				$cache->save(true);
			}
		}

		return $data;
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
			$infuraId = Q::ifset($chain, "providers", "walletconnect", "infura", "projectId", null);
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
	 * @method getChains
	 * @param {string} [$needChainId] if defined return only this chain info
	 * @static
	 * @return array
	 */
	static function getFactories()
	{
		return Q_Config::get('Users', 'Web3', 'factories', array());
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
};
