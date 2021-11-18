<?php
require_once USERS_PLUGIN_DIR.'/vendor/autoload.php';
use Web3\Web3;
use Web3\Contract;
use Crypto\Keccak;

/**
 * @module Users
 */
/**
 * Class handle with BlockChain
 *
 * @class Users_Web3
 */
class Users_Web3 extends Base_Users_Web3 {
	static $useCache = null;
	static $networks = array();

	/**
	 * Get needed environment variables
	 *
	 * @method construct
	 * @param {String} $chainId - Network chainId
	 * @static
	 */
	private static function construct($chainId) {
		if (self::$networks[$chainId]) {
			return;
		}

		if (self::$useCache === null) {
			self::$useCache = Q_Config::get("Users", "apps", "wallet", Users::communityId(), "Web3", "useCache", true);
		}

		$networks = Q_Config::expect("Users", "Web3", "networks");
		if (empty($networks)) {
			throw new Exception("Users_Web3: networks not found");
		}
		foreach ($networks as $n) {
			if ($n["chainId"] == $chainId) {
				self::$networks[$chainId]["network"] = $n;
				break;
			}
		}

		self::$networks[$chainId]["web3"] = new Web3(self::$networks[$chainId]["network"]["rpcUrls"][0]);

		$filePath = implode(DS, array(APP_WEB_DIR, "abi.json"));
		if (!is_file($filePath)) {
			$filePath = implode(DS, array(USERS_PLUGIN_WEB_DIR, "abi.json"));
		}
		if (!is_file($filePath)) {
			throw new Exception("Users_Web3: abi.json not found");
		}

		$abi = file_get_contents($filePath);
		self::$networks[$chainId]["contract"] = new Contract(self::$networks[$chainId]["network"]["rpcUrls"][0], $abi);
	}

	/**
	 * Aggregator for methods
	 * @method aggregator
	 * @static
	 * @param {String} $methodName
	 * @param {String|array} $param - params sent to contract method
	 * @param {String} $network - chainId
	 * @return array
	 */
	static function aggregator ($methodName, $param, $network) {
		self::construct($network);
		$network = self::$networks[$network];
		$contractAddress = $network["network"]["contract"];
		$contract = $network["contract"];
		$data = array();

		// call contract function
		$contract->at($contractAddress)->call($methodName, $param, function ($err, $results) use (&$data) {
			if (empty($results)) {
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
		});

		return $data;
	}

	/**
	 * @method totalSupply
	 * @static
	 * @param {String} $chainId - Network chainId
	 * @param {Boolean} [$updateCache=false] - If true request blockchain to update cache
	 * @return db_row|String
	 */
	static function totalSupply ($chainId, $updateCache=false) {
		self::construct($chainId);
		$cache = self::getCache(__FUNCTION__, $chainId, array());
		if ($cache->retrieved && $cache->result && self::$useCache && !$updateCache) {
			$result = Q::json_decode($cache->result);
			if (!empty($result) && (array)$result) {
				return $result;
			}
		}

		$data = self::aggregator(__FUNCTION__, null, $chainId);
		if ($data instanceof \phpseclib\Math\BigInteger) {
			$data = (int)preg_replace("/0+$/", "", $data->toString())/100;
		}

		$cache->result = Q::json_encode($data);
		$cache->save();

		return $data;
	}

	/**
	 * Get cache row for method name
	 * @method getCache
	 * @static
	 * @param {String} $methodName
	 * @param {String} $network - Network chainId
	 * @param {String} $params - params used to call the method
	 * @return db_row
	 */
	static function getCache ($methodName, $chainId, $params) {
		self::construct($chainId);
		$cache = new Users_Web3();
		$cache->chainId = self::$networks[$chainId]["network"]["chainId"];
		$cache->methodName = $methodName;
		$cache->contract = self::$networks[$chainId]["network"]["contract"];
		$cache->params = Q::json_encode($params);
		$cache->retrieve();

		return $cache;
	}
};