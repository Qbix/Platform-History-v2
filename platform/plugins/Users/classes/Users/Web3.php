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

	/**
	 * Used to execute methods on the blockchain
	 * @method execute
	 * @static
	 * $param {String} $chainId
	 * @param {String} $methodName
	 * @param {String|array} [$params=array()] - params sent to contract method
	 * @param {integer} [$cacheDuration=3600] How many seconds in the past to look for a cache
	 * @param {boolean|null} [$caching=true] Set false to ignore cache and request blocjchain
	 * @return array
	 */
	static function execute (
		$chainId,
		$methodName,
		$params = array(),
		$caching = true,
		$cacheDuration = null,
		$app = null)
	{
		if (!isset($app)) {
			$app = Q::app();
		}

		if ($cacheDuration === null) {
			$cacheDuration = Q::ifset($appInfo, 'cacheDuration', 3600);
		}

		if (self::$useCache === null) {
			self::$useCache = Q_Config::get("Users", "apps", "wallet", Users::communityId(), "Web3", "useCache", true);
		}

		$chainInfo = Q_Config::expect("Users", "Web3", "chains", $chainId);

		if ($caching && self::$useCache) {
			$cache = self::getCache($chainId, $chainInfo["contract"], $methodName, $params, $cacheDuration);
			if ($cache->wasRetrieved()) {
				$json = Q::json_decode($cache->result);
				if (is_array($json) || is_object($json)) {
					return $json;
				}

				return $cache->result;
			}
		}

		if (empty($chainInfo['rpcUrls'][0])) {
			throw new Q_Exception_MissingConfig(array(
				'fieldpath' => "'Users/apps/$app/rpcUrls[0]'"
			));
		}
		
		$filePath = implode(DS, array(
			APP_WEB_DIR, "ABI", $chainInfo["contract"] . ".json"
		));
		if (!is_file($filePath)) {
			throw new Exception("Users_Web3: $filePath not found");
		}
		$rpcUrl = $chainInfo['rpcUrls'][0];
		$abi = file_get_contents($filePath);
		$data = array();

		// call contract function
		(new Contract($rpcUrl, $abi))->at($chainInfo["contract"])->call($methodName, $params,
		function ($err, $results) use (&$data) {
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
		});

		if ($data instanceof \phpseclib\Math\BigInteger) {
			$cache->result = $data->toString();
		} else {
			$cache->result = Q::json_encode($data, true);
		}

		if ($data) {
			$cache->save(true);
		}

		return $data;
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
	 * @param {String} [$app]
	 * @return db_row
	 */
	static function getCache (
		$chainId, 
		$contract, 
		$methodName, 
		$params, 
		$cacheDuration)
	{
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