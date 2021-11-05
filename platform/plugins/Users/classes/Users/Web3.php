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

	static $web3 = null;
	static $contract = null;
	static $currentNetwork = null;
	static $useCache = null;

	/**
	 * Get needed environment variables
	 *
	 * @method construct
	 * @static
	 */
	private static function construct() {
		if (self::$useCache === null) {
			self::$useCache = Q_Config::get("Users", "apps", "wallet", Users::communityId(), "Web3", "useCache", true);
		}

		if (self::$currentNetwork === null) {
			self::$currentNetwork = Q_Config::expect("Users", "apps", "wallet", Users::communityId(), "network");
		}

		if (self::$web3 === null) {
			self::$web3 = new Web3(self::$currentNetwork["rpcUrls"][0]);
		}

		if (self::$contract === null) {
			$abi = file_get_contents(implode(DS, array(APP_WEB_DIR, "js", "nft-contract.abi.json")));
			self::$contract = new Contract(self::$currentNetwork["rpcUrls"][0], $abi);
		}
	}

	/**
	 * Aggregator for methods
	 * @method aggregator
	 * @static
	 * @param {String} $methodName
	 * @param {String} $params
	 * @param {String} [$contractAddress] by default the address of current network contract
	 * @return array
	 */
	private static function aggregator ($methodName, $params, $contractAddress = null) {
		self::construct();
		$contractAddress = $contractAddress ?: self::$currentNetwork["contract"];
		$data = array();

		// call contract function
		//$results = self::$contract->at($contractAddress)->getData($methodName, $params);
		self::$contract->at($contractAddress)->call($methodName, $params, function ($err, $results) use (&$data) {
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
	 * Get tokens by author
	 * @method tokensByAuthor
	 * @static
	 * @param {String} $address Author wallet address
	 * @param {String} [$contractAddress=null] Custom contract address
	 * @return array
	 */
	static function tokensByAuthor ($address, $contractAddress = null) {
		return self::aggregator(__FUNCTION__, $address, $contractAddress);
	}

	/**
	 * Get comission info by token
	 * @method commissionInfo
	 * @static
	 * @param {String} $tokenId
	 * @param {Boolean} [$updateCache=false] If true request blockchain to update cache
	 * @param {String} [$contractAddress=null] Custom contract address
	 * @return array
	 */
	static function getCommission ($tokenId, $updateCache=false, $contractAddress = null) {
		self::construct();
		$contractAddress = $contractAddress ?: self::$currentNetwork["contract"];
		$cache = self::getCache(__FUNCTION__);
		if (self::$useCache && !empty($cache->result) && (array)$cache->result) {
			return $cache->result;
		}

		$data = self::aggregator(__FUNCTION__, $tokenId, $contractAddress);
		$data["value"] = gmp_intval(Q::ifset($data, "r", "value", null));
		$cache->result = Q::json_encode($data);
		$cache->save();

		return $data;
	}

	/**
	 * Get tokens by owner
	 * @method tokensByOwner
	 * @static
	 * @param {String} $address Owner wallet address
	 * @param {String} [$contractAddress=null] Custom contract address
	 * @return array
	 */
	static function tokensByOwner ($address, $contractAddress = null) {
		return self::aggregator(__FUNCTION__, $address, $contractAddress);
	}

	/**
	 * Get author of token
	 * @method authorOf
	 * @static
	 * @param {String} $tokenId
	 * @param {Boolean} [$updateCache=false] If true request blockchain to update cache
	 * @param {String} [$contractAddress=null] Custom contract address
	 * @return array
	 */
	static function authorOf ($tokenId, $updateCache=false, $contractAddress = null) {
		self::construct();
		$contractAddress = $contractAddress ?: self::$currentNetwork["contract"];
		$cache = self::getCache(__FUNCTION__);
		if (self::$useCache && !empty($cache->result) && (array)$cache->result) {
			return $cache->result;
		}

		$data = self::aggregator(__FUNCTION__, $tokenId, $contractAddress);
		$cache->result = Q::json_encode($data);
		$cache->save();

		return $data;
	}

	/**
	 * Get owner of token
	 * @method ownerOf
	 * @static
	 * @param {String} $tokenId
	 * @param {Boolean} [$updateCache=false] If true request blockchain to update cache
	 * @param {String} [$contractAddress=null] Custom contract address
	 * @return array
	 */
	static function ownerOf ($tokenId, $updateCache=false, $contractAddress = null) {
		self::construct();
		$contractAddress = $contractAddress ?: self::$currentNetwork["contract"];
		$cache = self::getCache(__FUNCTION__);
		if (self::$useCache && !empty($cache->result) && (array)$cache->result) {
			return $cache->result;
		}

		$data = self::aggregator(__FUNCTION__, $tokenId, $contractAddress);
		$cache->result = Q::json_encode($data);
		$cache->save();

		return $data;
	}

	/**
	 * Get sale info by token
	 * @method saleInfo
	 * @static
	 * @param {String} $tokenId
	 * @param {Boolean} [$updateCache=false] If true request blockchain to update cache
	 * @param {String} [$contractAddress=null] Custom contract address
	 * @return array
	 */
	static function saleInfo ($tokenId, $updateCache=false, $contractAddress = null) {
		self::construct();
		$contractAddress = $contractAddress ?: self::$currentNetwork["contract"];
		$cache = self::getCache(__FUNCTION__);
		if (self::$useCache && !empty($cache->result) && (array)$cache->result) {
			return Q::json_decode($cache->result);
		}

		$data = self::aggregator(__FUNCTION__, $tokenId, $contractAddress);
		$data[1] = gmp_intval(Q::ifset($data, 1, "value", null));
		$cache->result = Q::json_encode($data);
		$cache->save();

		return $data;
	}

	/**
	 * Get cache row for method name
	 * @method getCache
	 * @static
	 * @param {String} $methodName
	 * @return db_row
	 */
	static function getCache ($methodName) {
		self::construct();
		$cache = new Users_Web3();
		$cache->chainId = (int)self::$currentNetwork["chainId"];
		$cache->methodId = substr(Keccak::hash($methodName, 256), 0, 8);
		$cache->methodName = $methodName;
		$cache->contract = self::$currentNetwork["contract"];
		$cache->params = Q::json_encode(compact("tokenId"));
		$cache->retrieve();
		return $cache;
	}
};