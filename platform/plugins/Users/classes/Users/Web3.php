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
	 * @param {string|array} $contractAddress the contract address to call the method on,
	 *  or array($contractAddress, $abiContent) to specify custom ABI content (JSON),
	 *  useful for when you have many contracts with the same ABI produced by a
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
		if (is_array($contractAddress)) {
			list($contractAddress, $abi) = $contractAddress;
		}

		if (!isset($appId)) {
			$appId = Q::app();
		}

		$usersWeb3Config = Q_Config::get("Users", "web3", "chains", $appId, array());
		list($appId, $appInfo) = Users::appInfo('web3', $appId, true);
		$appInfo = array_merge($appInfo, $usersWeb3Config);
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

		if (empty($abi)) {
			$abi = self::getABIFileContent($contractAddress, $chainId);
		}
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
				if (is_array($results[0])) {
					foreach ($results[0] as $result) {
						$data[] = $result->toString();
					}
				} else {
					$data = $results[0];
				}
			} else {
				$data = $results;
			}
		};

		$contract = (new Contract($rpcUrl, $abi, $defaultBlock))
			->at($contractAddress);
		if ($privateKey) {
			if (empty($transaction['from'])) {
				throw new Q_Exception_MissingObject(array(
					'name' => 'transaction.from'
				));
			}
			$eth = $contract->eth;
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
	 * Get content of the ABI file for a contract.
	 * Taken from Users/web3/contracts/$contractName/filename config.
	 * As a fallback tries Users/web3/contracts/$contractName/dir and if found,
	 * appends "/$contractAddress.json". As a last resort, tries
	 * Users/web3/contracts/$contractName/url and calls filenameFromUrl().
	 * You can interpolate "baseUrl" and "contractAddress" variables in the strings.
	 * 
	 * @method getABIFileContent
	 * @static
	 * @param {string} $contractAddress - The address of the contract. The chain doesn't matter because we assume all contracts with same address have same code on all chains.
	 * @param {string} $chainId
	 * @param {string} [$caching=true] - Set false to ignore cache and request blockchain every time.
	 * @param {Boolean} [$throwIfNotFound=true] - If true, throw exception if ABI file not found.
	 * @return {string|null} Tries filename, then $dir/$contractAddress.json, then url from config
	 */
	static function getABIFileContent ($contractAddress, $chainId, $caching=true, $throwIfNotFound=true)
	{
		/**
		 * @event Users/Web3/getABIFilename {before}
		 * @param {string} $contractAddress
		 * @param {string} $appId
		 * @return {string} the filename of the file to load
		 */
		Q::event(
			'Users/Web3/getABIFileContent', compact('contractAddress', 'chainId'),
			'before', false, $ABIjson
		);
		if ($ABIjson) {
			return $ABIjson;
		}

		$methodName = "usersWeb3GetABI";
		$abiUrl = Q_Config::get("Users", "web3", "chains", $chainId, "abiUrl", null);
		if (!$abiUrl && $throwIfNotFound) {
			throw new Exception("ABI URL not found for this chain");
		}
		$abiUrl = Q::interpolate($abiUrl, compact("contractAddress"));

		// check cache
		$cache = self::getCache($chainId, $contractAddress, $methodName, array());
		if ($caching && $cache->wasRetrieved()) {
			return Q::json_decode($cache->result, true);
		}

		// get remote json by ABI url
		$content = file_get_contents($abiUrl);
		try {
			$ABIjson = Q::json_decode($content, true);
			if (gettype($ABIjson["result"]) == "string") {
				$ABIjson = Q::json_decode($ABIjson["result"], true);
			} else {
				$ABIjson = $ABIjson["result"];
			}
		} catch (Exception $e) {
			if ($throwIfNotFound) {
				throw new Exception("invalid ABI json");
			}
			return null;
		}

		$cache->result = Q::json_encode($ABIjson);
		$cache->save(true);

		return $ABIjson;
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
	 * Get wallet address by user id
	 * @method getWalletById
	 * @static
	 * @param {String} [$userId] - If empty, logged in userId used
	 * @param {Boolean} [$throwIfNotFound=false] - If true, throw exception if wallet addres not found
	 * @return {String|null}
	 */
	static function getWalletById ($userId=null, $throwIfNotFound=false) {
		$userId = $userId ?: Users::loggedInUser(true)->id;
		$usersExternalTo = Users_ExternalTo::select()->where(array(
			"platform" => "web3",
			"appId" => "all",
			"userId" => strtolower($userId)
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
	 * Get user id by wallet address
	 * @method getIdByWallet
	 * @static
	 * @param {String} $wallet - wallet address
	 * @param {Boolean} [$throwIfNotFound=false] If true, throw exception if wallet addres not found
	 * @return {String|null}
	 */
	static function getIdByWallet ($wallet, $throwIfNotFound=false) {
		$usersExternalFrom = Users_ExternalFrom::select()->where(array(
			"platform" => "web3",
			"appId" => "all",
			"xid" => strtolower($wallet)
		))->fetchDbRow();

		if ($usersExternalFrom) {
			return $usersExternalFrom->userId;
		}

		if ($throwIfNotFound) {
			throw new Exception("User id not found");
		}

		return null;
	}

	/**
	 * Get user id by wallet address
	 * @method existsInABI
	 * @static
	 * @param {String} $name - The name of method or event
	 * @param {array} $ABI - ABI json
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
};
