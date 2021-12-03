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
	/**
	 * Used to execute methods on the blockchain
	 * @method execute
	 * @static
	 * @param {string} $contractAddress on that chain
	 * @param {string} $methodName in the contract
	 * @param {string|array} [$params=array()] - params sent to contract method
	 * @param {integer} [$cacheDuration=3600] How many seconds in the past to look for a cache
	 * @param {boolean|null} [$caching=true] Set false to ignore cache and request blocjchain
	 * @param {string} [$appId=Q::app()] Indicate which entery in Users/apps config to use
	 * @return array
	 */
	static function execute (
		$contractAddress,
		$methodName,
		$params = array(),
		$caching = true,
		$cacheDuration = null,
		$appId = null)
	{
		if (!isset($appId)) {
			$appId = Q::app();
		}

		list($chainId, $appInfo) = Users::appInfo('wallet', $appId, true);
		if ($cacheDuration === null) {
			$cacheDuration = Q::ifset($appInfo, 'cacheDuration', 3600);
		}
		$chainId = Q::ifset($appInfo, 'chainId', Q::ifset($appInfo, 'appId', null));
		if (!$chainId) {
			throw new Q_Exception_MissingConfig(array(
				'fieldpath' => "'Users/apps/$appId/chainId'"
			));
		}

		if ($caching && $cacheDuration) {
			$cache = self::getCache($chainId, $contractAddress, $methodName, $params, $cacheDuration);
			if ($cache->wasRetrieved()) {
				$json = Q::json_decode($cache->result);
				if (is_array($json) || is_object($json)) {
					return $json;
				}

				return $cache->result;
			}
		}

		if (empty($appInfo['rpcUrls'][0])) {
			throw new Q_Exception_MissingConfig(array(
				'fieldpath' => "Users/apps/$appId/rpcUrls[0]"
			));
		}
		$rpcUrl = $appInfo['rpcUrls'][0];

		$filename = self::getABIFilename($contractAddress);
		if (!is_file($filename)) {
			throw new Q_Exception_MissingFile(compact('filename'));
		}
		$abi = file_get_contents($filename);
		$data = array();

		// call contract function
		(new Contract($rpcUrl, $abi))
		->at($contractAddress)
		->call($methodName, $params,
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

		if (($data && $caching !== false)
		or (!$data && $caching === true)) {
			$cache->save(true);
		}

		return $data;
	}

	/**
	 * Get the filename of the ABI file for a contract. Taken from Users/web3/contracts/$contractName/ABIFilename config usually.
	 * @method getABIFilename
	 * @static
	 * @param {string} $contractAddress The address of the contract. The chain doesn't matter because we assume all contracts with same address have same code on all chains.
	 * @return {string}
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
			'Users/Web3/getABIFilename', compact('contractAddress', 'appId'), 
			'before', false, $filename
		);
		if ($filename) {
			return $filename;
		}
		if (!isset(self::$abiFilenames[$contractAddress])) {
			$config = Q_Config::get(
				'Users', 'web3', 'contracts', $contractAddress, array()
			);
			if (!empty($config['filename'])) {
				$filename = Q::interpolate($config['filename'], compact('baseUrl', 'contractAddress'));
				return APP_WEB_DIR . DS . implode(DS, explode('/', $filename));
			}
			if (!empty($config['dir'])) {
				$dir = Q::interpolate($config['filename'], compact('baseUrl', 'contractAddress'));
				return APP_WEB_DIR . DS . implode(DS, explode('/', $dir))
					. DS . "$contractAddress.json";
			}
			if (!empty($config['url'])) {
				$url = Q_Uri::interpolateUrl($url, compact('contractAddress'));
				return Q_Uri::filenameFromUrl($url);
			}
		}
		return self::$abiFilenames[$contractAddress];
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
	 * @param {String} [$app] TehThe internal app ID
	 * @return {Db_Row}
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