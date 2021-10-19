<?php
require_once USERS_PLUGIN_DIR.'/vendor/autoload.php';
use Web3\Web3;
use Web3\Contract;

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
	static $contrcat = null;
	static $currentNetwork = null;

	/**
	 * Get current network from config
	 *
	 * @method getCurrentNetwork
	 * @static
	 * @return self::$currentNetwork
	 */
	static function getCurrentNetwork() {
		if (self::$currentNetwork) {
			return self::$currentNetwork;
		}

		self::$currentNetwork = Q_Config::expect("Users", "apps", "wallet", Users::communityId(), "network");
		return self::$currentNetwork;
	}

	/**
	 * Create Web3 instance
	 *
	 * @method getWeb3
	 * @static
	 * @return Web3
	 */
	static function getWeb3 () {
		if (self::$web3) {
			return self::$web3;
		}

		$currentNetwork = self::getCurrentNetwork();
		self::$web3 = new Web3($currentNetwork["rpcUrls"][0]);
		return self::$web3;
	}

	/**
	 * Create Contract instance
	 *
	 * @method getContract
	 * @static
	 * @return Web3/Contract
	 */
	static function getContract () {
		if (self::$contrcat) {
			return self::$contrcat;
		}

		$currentNetwork = self::getCurrentNetwork();
		$abi = file_get_contents(implode(DS, array(APP_WEB_DIR, "js", "nft-contract.abi.json")));
		self::$contrcat = new Contract($currentNetwork["rpcUrls"][0], $abi);
		return self::$contrcat;
	}

	/**
	 * Aggregator for methods
	 * @method aggregator
	 * @static
	 * @param {String} $methodName
	 * @param {String} $param
	 * @param {String} [$contractAddress] by default the address of current network contract
	 * @return array
	 */
	private static function aggregator ($methodName, $param, $contractAddress = null) {
		$contract = self::getContract();
		$contractAddress = $contractAddress ?: self::$currentNetwork["contract"];
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
	 * @return array
	 */
	static function tokensByAuthor ($address, $contractAddress = null) {
		return self::aggregator("tokensByAuthor", $address, $contractAddress);
	}

	/**
	 * Get tokens by owner
	 * @method tokensByOwner
	 * @static
	 * @param {String} $address Owner wallet address
	 * @return array
	 */
	static function tokensByOwner ($address, $contractAddress = null) {
		return self::aggregator("tokensByOwner", $address, $contractAddress);
	}

	/**
	 * Get author of token
	 * @method authorOf
	 * @static
	 * @param {String} $tokenId
	 * @return array
	 */
	static function authorOf ($tokenId, $contractAddress = null) {
		$contractAddress = $contractAddress ?: self::getCurrentNetwork()["contract"];
		$cache = new Users_Web3();
		$cache->tokenId = $tokenId;
		$cache->contract = $contractAddress;
		if ($cache->retrieve() && $cache->author) {
			return $cache->author;
		}

		$cache->author = self::aggregator("authorOf", $tokenId, $contractAddress);
		$cache->save();

		return $cache->author;
	}

	/**
	 * Get owner of token
	 * @method ownerOf
	 * @static
	 * @param {String} $tokenId
	 * @return array
	 */
	static function ownerOf ($tokenId, $contractAddress = null) {
		$contractAddress = $contractAddress ?: self::getCurrentNetwork()["contract"];
		$cache = new Users_Web3();
		$cache->tokenId = $tokenId;
		$cache->contract = $contractAddress;
		if ($cache->retrieve() && $cache->owner) {
			return $cache->owner;
		}

		$cache->owner = self::aggregator("ownerOf", $tokenId, $contractAddress);
		$cache->save();

		return $cache->owner;
	}

	/**
	 * Get sale info by token
	 * @method saleInfo
	 * @static
	 * @param {String} $tokenId
	 * @return array
	 */
	static function saleInfo ($tokenId, $contractAddress = null) {
		$contractAddress = $contractAddress ?: self::getCurrentNetwork()["contract"];
		$cache = new Users_Web3();
		$cache->tokenId = $tokenId;
		$cache->contract = $contractAddress;
		if ($cache->retrieve()) {
			$saleInfo = Q::json_decode($cache->saleInfo);
			if (!empty($saleInfo) && (array)$saleInfo) {
				return $saleInfo;
			}
		}

		$data = self::aggregator("saleInfo", $tokenId, $contractAddress);
		$data[1] = gmp_intval(Q::ifset($data, 1, "value", null));

		$cache->saleInfo = Q::json_encode($data);
		$cache->onSale = $data[2] ? 1 : 0;
		$cache->save();

		return $data;
	}
};