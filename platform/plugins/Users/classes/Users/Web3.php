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

	private static function chainInfo($chainId)
	{
		return Q_Config::expect("Users", "web3", "chains", $chainId);
	}

	/**
	 * Used to execute methods on the blockchain
	 * @method execute
	 * @static
	 * $param {String} $contract
	 * @param {String} $methodName
	 * @param {String|array} [$params=array()] - params sent to contract method
	 * @param {integer} [$cacheDuration=3600] How many seconds in the past to look for a cache
	 * @param {boolean|null} [$caching=null] Pass false to suppress all caching. Pass true to cache everything. The default is null, which caches everything except empty results.
	 * @return array
	 */
	static function execute (
		$contract,
		$methodName,
		$params = array(), 
		$cacheDuration = 3600,
		$caching = null,
		$app = null)
	{
		if (!isset($appId)) {
			$app = Q::app();
		}
		
		list($appId, $appInfo) = Users::appInfo('wallet', $app, true);
		$chainId = $appInfo['appId'];
		
		$cache = self::getCache($chainId, $contract, $methodName, $params, $chainId);
		if ($cache->wasRetrieved()) {
			return $cache;
		}
		
		$cacheDuration = Q::ifset($appInfo, 'cacheDuration', 3600);
		$chainInfo = self::chainInfo($chainId);
		if (empty($chainInfo['rpcUrls'][0])) {
			throw new Q_Exception_MissingConfig(array(
				'fieldpath' => "'Users/apps/$app/rpcUrls[0]'"
			));
		}
		
		$filePath = implode(DS, array(
			APP_VIEWS_DIR, "Users", "ABI", $contract . ".json"
		));
		if (!is_file($filePath)) {
			throw new Exception("Users_Web3: $filePath not found");
		}
		$rpcUrl = $chainInfo['rpcUrls'][0];
		$abi = file_get_contents($filePath);
		$c = new Contract($rpcUrl, $abi);
		
		$data = array();

		// call contract function
		$c->at($contract)->call($methodName, $params,
		function ($err, $results) use (&$data, $caching) {
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
		if (($data && $caching !== false)
		or (!$data && $caching === true)) {
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
		$cacheDuration = 3600)
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