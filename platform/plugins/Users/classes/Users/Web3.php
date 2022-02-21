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
	 * @param {boolean|null|callable} [$caching=true] Set false to ignore cache and request blockchain every time.
	 *  Set to null to cache any truthy result while not caching falsy results.
	 *  Or set to a callable function, to be passed the data as JSON, and return boolean indicating whether to cache or not.
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

		$cache = null;
		if ($caching !== false && $cacheDuration) {
			$cache = self::getCache($chainId, $contractAddress, $methodName, $params, $cacheDuration);
			if ($cache->wasRetrieved()) {
				return Q::json_decode($cache->result);
			}
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

	static $networks = array();
	static $useCache = null;

	/**
	 * Get needed environment variables
	 *
	 * @method construct
	 * @param {String} $chainId
	 * @static
	 */
	private static function construct($chainId) {
		if (self::$useCache === null) {
			self::$useCache = Q_Config::get("Assets", "web3", "useCache", true);
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
	 * Get tokens by author
	 * @method tokensByAuthor
	 * @static
	 * @param {String} $address Author wallet address
	 * @param {String} $chainId
	 * @return array
	 */
	static function tokensByAuthor ($address, $chainId) {
		self::construct($chainId);
		$network = self::$networks[$chainId];
		return self::execute($network["contract"], __FUNCTION__, $address);
	}

	/**
	 * Get comission info by token
	 * @method commissionInfo
	 * @static
	 * @param {String} $tokenId
	 * @param {String} $chainId
	 * @param {Boolean} [$updateCache=false] If true request blockchain to update cache
	 * @param {String} [$contractAddress=null] Custom contract address
	 * @return array
	 */
	static function commissionInfo ($tokenId, $chainId, $updateCache=false) {
		self::construct($chainId);
		$network = self::$networks[$chainId];
		$data = self::execute($network["contract"],"getCommission", $tokenId, null, $updateCache);
		$data["value"] = gmp_intval(Q::ifset($data, "r", "value", null));

		return $data;
	}

	/**
	 * Get tokens by owner
	 * @method tokensByOwner
	 * @static
	 * @param {String} $address Owner wallet address
	 * @param {String} $chainId
	 * @return array
	 */
	static function tokensByOwner ($address, $chainId) {
		self::construct($chainId);
		$network = self::$networks[$chainId];
		return self::execute($network["contract"],__FUNCTION__, $address);
	}

	/**
	 * Get author of token
	 * @method authorOf
	 * @static
	 * @param {String} $tokenId
	 * @param {String} $chainId
	 * @param {Boolean} [$updateCache=false] If true request blockchain to update cache
	 * @param {String} [$contractAddress=null] Custom contract address
	 * @return array
	 */
	static function authorOf ($tokenId, $chainId, $updateCache=false) {
		self::construct($chainId);
		$network = self::$networks[$chainId];
		return self::execute($network["contract"],__FUNCTION__, $tokenId, null, $updateCache);
	}

	/**
	 * Get owner of token
	 * @method ownerOf
	 * @static
	 * @param {String} $tokenId
	 * @param {String} $chainId network symbol
	 * @param {Boolean} [$updateCache=false] If true request blockchain to update cache
	 * @return array
	 */
	static function ownerOf ($tokenId, $chainId, $updateCache=false) {
		self::construct($chainId);
		$network = self::$networks[$chainId];
		return self::execute($network["contract"],__FUNCTION__, $tokenId, null, $updateCache);
	}

	/**
	 * Get sale info by token
	 * @method saleInfo
	 * @static
	 * @param {String} $tokenId
	 * @param {String} $chainId
	 * @param {Boolean} [$updateCache=false] If true request blockchain to update cache
	 * @return array
	 */
	static function saleInfo ($tokenId, $chainId, $updateCache=false) {
		self::construct($chainId);
		$network = self::$networks[$chainId];
		$data = self::execute($network["contract"],__FUNCTION__, $tokenId, null, $updateCache);
		$data[1] = gmp_intval(Q::ifset($data, 1, "value", null));
		return $data;
	}

	/**
	 * Get currency by chainId and currency token
	 * @method getCurrencyByChain
	 * @static
	 * @param {String} $chainId
	 * @param {String} $currencyToken currency token
	 * @return array
	 */
	static function getCurrencyByChain ($chainId, $currencyToken) {
		$currencies = Q_Config::expect("Users", "web3", "currencies");
		foreach ($currencies as $currency) {
			if ($currency[$chainId] == $currencyToken) {
				return $currency;
			}
		}
	}

	/**
	 * Get available blockchain networks info (contact address, currency, rpcUrl, blockExplorerUrl)
	 * @method getChains
	 * @static
	 * @return array
	 */
	static function getChains () {
		$chains = Q_Config::get("Users", "apps", "web3", array());
		$currencies = Q_Config::get("Users", "web3", "currencies", array());
		$chainsClient = array();
		foreach ($chains as $i => $chain) {
			// if contract or rpcUrls undefined, skip this chain
			$contract = Q::ifset($chain, "contracts", "NFT", "address", null);
			$rpcUrl = Q::ifset($chain, "rpcUrl", null);
			$infuraId = Q::ifset($chain, "providers", "walletconnect", "infura", "projectId", null);
			$blockExplorerUrl = Q::ifset($chain, "blockExplorerUrl", null);
			$chainId = Q::ifset($chain, "appId", null);

			if (!$contract || !$rpcUrl) {
				unset($chain[$i]);
				continue;
			}

			$rpcUrl = Q::interpolate($rpcUrl, compact("infuraId"));
			$temp = compact("chainId", "contract", "rpcUrl", "blockExplorerUrl");

			foreach ($currencies as $currency) {
				if ($currency[$chainId] == "0x0000000000000000000000000000000000000000") {
					$temp["currency"] = $currency;
					$temp["currency"]["token"] = $currency[$chainId];
					break;
				}
			}

			$temp["default"] = $i == Users::communityId();

			$chainsClient[$chainId] = $temp;
		}

		return $chainsClient;
	}

	/**
	 * Get sale info by token
	 * @method saleInfo
	 * @static
	 * @param {String} $tokenId
	 * @param {String} $chainId
	 * @param {Boolean} [$updateCache=false] If true request blockchain to update cache
	 * @return array
	 */
	static function getSaleInfo ($tokenId, $chainId, $updateCache=false) {
		self::construct($chainId);
		$network = self::$networks[$chainId];
		$data = self::execute($network["contract"],__FUNCTION__, $tokenId, null, $updateCache);
		$data[1] = gmp_intval(Q::ifset($data, 1, "value", null));
		return $data;
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
	 * @param {String} $contract
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