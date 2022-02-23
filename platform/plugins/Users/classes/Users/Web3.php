<?php
require_once USERS_PLUGIN_DIR.'/vendor/autoload.php';
use Web3\Web3;
use Web3\Contract;
use Crypto\Keccak;

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
	 * Used to execute methods on the blockchain
	 * @method execute
	 * @static
	 * @param {string|array} $contractAddress the contract address to call the method on,
	 *  or array($contractAddress, $abiContent) to specify custom ABI content (JSON),
	 *  useful for when you have many contracts with the same ABI produced by a
	 * @param {string} $methodName in the contract
	 * @param {string|array} [$params=array()] - params sent to contract method
	 * @param {string} [$appId=Q::app()] Indicate which entery in Users/apps config to use
	 * @param {boolean} [$caching=true] Set false to ignore cache and request blockchain and update cache.
	 * @param {integer} [$cacheDuration=3600] How many seconds in the past to look for a cache
	 * @return array
	 */
	static function execute (
		$contractAddress,
		$methodName,
		$params = array(),
		$appId = null,
		$caching = true,
		$cacheDuration = null)
	{
		if (is_array($contractAddress)) {
			list($contractAddress, $abi) = $contractAddress;
		}

		if (!isset($appId)) {
			$appId = Q::app();
		}

		list($appId, $appInfo) = Users::appInfo('web3', $appId, true);
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

		$cache = self::getCache($chainId, $contractAddress, $methodName, $params, $cacheDuration);
		if ($caching && $cache->wasRetrieved()) {
			return Q::json_decode($cache->result);
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
			$filename = self::getABIFilename($contractAddress);
			if (!is_file($filename)) {
				throw new Q_Exception_MissingFile(compact('filename'));
			}
			$abi = file_get_contents($filename);
		}
		$data = array();
		$arguments = array($methodName);
		foreach ($params as $param) {
			$arguments[] = $param;
		}
		$arguments[] = function ($err, $results) use (&$data) {
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

		// call contract function
		$contract = (new Contract($rpcUrl, $abi))
		->at($contractAddress);
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
			$cache->result = Q::json_encode($data);
			$cache->save(true);
		}

		return $data;
	}

	static $networks = array();
	static $useCache = null;

	/**
	 * Get needed environment variables
	 *
	 * @method construct
	 * @param {String} $chainId
	 * @static
	 */
	protected static function construct($chainId) {
		if (self::$useCache === null) {
			self::$useCache = Q_Config::get("Users", "web3", "useCache", true);
		}

		if (self::$networks[$chainId]) {
			return;
		}

		$networks = Q_Config::expect("Users", "apps", "web3");
		foreach ($networks as $n) {
			if ($n["appId"] == $chainId) {
				$n["chainId"] = $n["appId"];
				unset($n["appId"]);
				self::$networks[$chainId]["network"] = $n;
				break;
			}
		}

		$rpcUrl = self::$networks[$chainId]["network"]["rpcUrl"];
		self::$networks[$chainId]["web3"] = new Web3($rpcUrl);

		$abiPath = "ABI/".self::$networks[$chainId]["network"]["contracts"]["NFT"]["address"].".json";
		$filePath = implode(DS, array(APP_WEB_DIR, $abiPath));
		if (!is_file($filePath)) {
			$filePath = implode(DS, array(USERS_PLUGIN_WEB_DIR, $abiPath));
		}
		if (!is_file($filePath)) {
			throw new Exception("Users_Web3: abi.json not found");
		}

		$abi = file_get_contents($filePath);
		self::$networks[$chainId]["contract"] = new Contract($rpcUrl, $abi);
	}

	/**
	 * Get the filename of the ABI file for a contract. 
	 * Taken from Users/web3/contracts/$contractName/filename config.
	 * As a fallback tries Users/web3/contracts/$contractName/dir and if found,
	 * appends "/$contractAddress.json". As a last resort, tries
	 * Users/web3/contracts/$contractName/url and calls filenameFromUrl().
	 * You can interpolate "baseUrl" and "contractAddress" variables in the strings.
	 * 
	 * @method getABIFilename
	 * @static
	 * @param {string} $contractAddress The address of the contract. The chain doesn't matter because we assume all contracts with same address have same code on all chains.
	 * @return {string|null} Tries filename, then $dir/$contractAddress.json, then url from config
	 */
	static function getABIFilename ($contractAddress)
	{
		/**
		 * @event Users/Web3/getABIFilename {before}
		 * @param {string} $contractAddress
		 * @param {string} $appId
		 * @return {string} the filename of the file to load
		 */
		$filename = Q::event(
			'Users/Web/getABIFilename', compact('contractAddress'), 
			'before', false, $filename
		);
		if ($filename) {
			return $filename;
		}

		$baseUrl = Q_Request::baseUrl();
		$config = Q_Config::get(
			'Users', 'web3', 'contracts', $contractAddress, array()
		);
		if (!empty($config['filename'])) {
			$filename = Q::interpolate($config['filename'], compact("contractAddress"));
			return APP_WEB_DIR . DS . implode(DS, explode('/', $filename));
		}
		if (!empty($config['dir'])) {
			return APP_WEB_DIR . DS . implode(DS, explode('/', $config['dir']))
				. DS . "$contractAddress.json";
		}
		if (!empty($config['url'])) {
			$url = Q_Uri::interpolateUrl($config['url'], compact("baseUrl", "contractAddress"));
			return Q_Uri::filenameFromUrl($url);
		}

		return implode(DS, [APP_WEB_DIR, "ABI", $contractAddress.".json"]);
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
	 * @param {integer} [$cacheDuration=3600]
	 * @param {String} [$app] The internal app ID
	 * @return {Db_Row}
	 */
	static function getCache (
		$chainId,
		$contract,
		$methodName, 
		$params, 
		$cacheDuration)
	{
		if ($cacheDuration === null) {
			$cacheDuration = Q::ifset($appInfo, 'cacheDuration', 3600);
		}
		$cached = new Users_Web3(array(
			'chainId' => $chainId,
			'contract' => $contract,
			'methodName' => $methodName,
			'params' => Q::json_encode($params),
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

};