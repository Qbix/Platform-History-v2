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
	 * @param {String} $network - chainId
	 * @static
	 */
	private static function construct($network) {
		if (self::$useCache === null) {
			self::$useCache = Q_Config::get("Users", "apps", "wallet", Users::communityId(), "Web3", "useCache", true);
		}

		if (self::$networks[$network]) {
			return;
		}

		$networks = Q_Config::expect(Users::communityId(), "networks");
		foreach ($networks as $n) {
			if ($n["chainId"] == $network) {
				self::$networks[$network]["network"] = $n;
				break;
			}
		}

		self::$networks[$network]["web3"] = new Web3(self::$networks[$network]["network"]["rpcUrls"][0]);

		$abi = file_get_contents(implode(DS, array(APP_WEB_DIR, "js", "nft-contract.abi.json")));
		self::$networks[$network]["contract"] = new Contract(self::$networks[$network]["network"]["rpcUrls"][0], $abi);
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
	private static function aggregator ($methodName, $param, $network) {
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
	 * Get tokens by author
	 * @method tokensByAuthor
	 * @static
	 * @param {String} $address Author wallet address
	 * @param {String} $network - chainId
	 * @return array
	 */
	static function tokensByAuthor ($address, $network) {
		self::construct($network);
		return self::aggregator(__FUNCTION__, $address, $network);
	}

	/**
	 * Get comission info by token
	 * @method getCommission
	 * @static
	 * @param {String} $tokenId
	 * @param {String} $network - chainId
	 * @param {Boolean} [$updateCache=false] - If true request blockchain to update cache
	 * @param {String} [$contractAddress=null] - Custom contract address
	 * @return array
	 */
	static function getCommission ($tokenId, $network, $updateCache=false) {
		self::construct($network);
		$cache = self::getCache(__FUNCTION__, $network, compact("tokenId"));
		if ($cache->retrieved && $cache->result && self::$useCache && !$updateCache) {
			$result = Q::json_decode($cache->result);
			if (!empty($result) && (array)$result) {
				return $result;
			}
		}

		$data = self::aggregator(__FUNCTION__, $tokenId, $network);
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
	 * @param {String} $network - chainId
	 * @return array
	 */
	static function tokensByOwner ($address, $network) {
		self::construct($network);
		return self::aggregator(__FUNCTION__, $address, $network);
	}

	/**
	 * Get author of token
	 * @method authorOf
	 * @static
	 * @param {String} $tokenId
	 * @param {String} $network - chainId
	 * @param {Boolean} [$updateCache=false] - If true request blockchain to update cache
	 * @param {String} [$contractAddress=null] - Custom contract address
	 * @return array
	 */
	static function authorOf ($tokenId, $network, $updateCache=false) {
		self::construct($network);
		$cache = self::getCache(__FUNCTION__, $network, compact("tokenId"));
		if ($cache->retrieved && $cache->result && self::$useCache && !$updateCache) {
			return $cache->result;
		}

		$data = self::aggregator(__FUNCTION__, $tokenId, $network);
		$cache->result = $data;
		$cache->save();

		return $data;
	}

	/**
	 * Get owner of token
	 * @method ownerOf
	 * @static
	 * @param {String} $tokenId
	 * @param {String} $network - chainId
	 * @param {Boolean} [$updateCache=false] - If true request blockchain to update cache
	 * @return array
	 */
	static function ownerOf ($tokenId, $network, $updateCache=false) {
		self::construct($network);
		$cache = self::getCache(__FUNCTION__, $network, compact("tokenId"));
		if ($cache->retrieved && $cache->result && self::$useCache && !$updateCache) {
			return $cache->result;
		}

		$data = self::aggregator(__FUNCTION__, $tokenId, $network);
		$cache->result = $data;
		$cache->save();

		return $data;
	}

	/**
	 * Get URI to json with related data
	 * @method tokenURI
	 * @static
	 * @param {String} $tokenId
	 * @param {String} $network - chainId
	 * @param {Boolean} [$updateCache=false] - If true request blockchain to update cache
	 * @return array
	 */
	static function tokenURI ($tokenId, $network, $updateCache=false) {
		self::construct($network);
		$cache = self::getCache(__FUNCTION__, $network, compact("tokenId"));
		if ($cache->retrieved && $cache->result && self::$useCache && !$updateCache) {
			return $cache->result;
		}

		$data = self::aggregator(__FUNCTION__, $tokenId, $network);
		$cache->result = $data;
		$cache->save();

		return $data;
	}

	/**
	 * Get wallet balance
	 * @method balanceOf
	 * @static
	 * @param {String} $walletAddress
	 * @param {String} $network - chainId
	 * @param {Boolean} [$updateCache=false] - If true request blockchain to update cache
	 * @return string
	 */
	static function balanceOf ($walletAddress, $network, $updateCache=false) {
		self::construct($network);
		$cache = self::getCache(__FUNCTION__, $network, compact("walletAddress"));
		if ($cache->retrieved && $cache->result && self::$useCache && !$updateCache) {
			return $cache->result;
		}

		$data = (string)self::aggregator(__FUNCTION__, $walletAddress, $network);

		$cache->result = $data;
		$cache->save();

		return $data;
	}

	/**
	 *
	 * @method getApproved
	 * @static
	 * @param {String} $tokenId
	 * @param {String} $network - chainId
	 * @param {Boolean} [$updateCache=false] - If true request blockchain to update cache
	 * @return string
	 */
	static function getApproved ($tokenId, $network, $updateCache=false) {
		self::construct($network);
		$cache = self::getCache(__FUNCTION__, $network, compact("tokenId"));
		if ($cache->retrieved && $cache->result && self::$useCache && !$updateCache) {
			return $cache->result;
		}

		$data = self::aggregator(__FUNCTION__, $tokenId, $network);

		$cache->result = $data;
		$cache->save();

		return $data;
	}

	/**
	 * Get sale info by token
	 * @method saleInfo
	 * @static
	 * @param {String} $tokenId
	 * @param {String} $network - chainId
	 * @param {Boolean} [$updateCache=false] If true request blockchain to update cache
	 * @return array
	 */
	static function saleInfo ($tokenId, $network, $updateCache=false) {
		self::construct($network);
		$cache = self::getCache(__FUNCTION__, $network, compact("tokenId"));
		if ($cache->retrieved && $cache->result && self::$useCache && !$updateCache) {
			$result = Q::json_decode($cache->result);
			if (!empty($result) && (array)$result) {
				return $result;
			}
		}

		$data = self::aggregator(__FUNCTION__, $tokenId, $network);
		$data[1] = gmp_intval(Q::ifset($data, 1, "value", null));

		$cache->result = Q::json_encode($data);
		$cache->save();

		return $data;
	}

	/**
	 * Get sale info by token
	 * @method saleInfo
	 * @static
	 * @param {String} $tokenId
	 * @param {String} $network - chainId
	 * @param {Boolean} [$updateCache=false] If true request blockchain to update cache
	 * @return array
	 */
	static function getSaleInfo ($tokenId, $network, $updateCache=false) {
		self::construct($network);
		$cache = self::getCache(__FUNCTION__, $network, compact("tokenId"));
		if ($cache->retrieved && $cache->result && self::$useCache && !$updateCache) {
			$result = Q::json_decode($cache->result);
			if (!empty($result) && (array)$result) {
				return $result;
			}
		}

		$data = self::aggregator(__FUNCTION__, $tokenId, $network);
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
	 * @param {String} $network - chainId
	 * @param {String} $params - params used to call the method
	 * @return db_row
	 */
	static function getCache ($methodName, $network, $params) {
		self::construct($network);
		$cache = new Users_Web3();
		$cache->chainId = self::$networks[$network]["network"]["chainId"];
		$cache->methodName = $methodName;
		$cache->contract = self::$networks[$network]["network"]["contract"];
		$cache->params = Q::json_encode($params);
		$cache->retrieve();

		return $cache;
	}
};