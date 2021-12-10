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

		list($appId, $appInfo) = Users::appInfo('web3', $appId, true);
		if ($cacheDuration === null) {
			$cacheDuration = Q::ifset($appInfo, 'cacheDuration', 3600);
		}

		// get chainId
		$chainId = null;
		$chains = Q::ifset($appInfo, "chains", []);
		if (empty($chains)) {
			throw new Q_Exception_MissingConfig(array(
				'fieldpath' => "'Users/apps/$appId/chains'"
			));
		}

		foreach ($chains as $chain) {
			if ($chain["contract"] == $contractAddress) {
				$chainId = $chain["chainId"];
				break;
			}
		}

		if (empty($chainId)) {
			throw new Exception("Chain for contract ".$contractAddress." no exists");
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

		$rpcUrl = Q::ifset($chain, "rpcUrls", 0, null);
		if (!$rpcUrl) {
			throw new Q_Exception_MissingConfig(array(
				'fieldpath' => "Users/apps/$appId/chains/$chainId/rpcUrls[0]"
			));
		}

		$projectId = Q::ifset($chain, "infura", "projectId", null);
		if ($projectId) {
			$rpcUrl = Q::interpolate($rpcUrl, compact("projectId"));
		}

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
			$errMessage = Q::ifset($err, "message", null);
			if ($errMessage) {
				throw new Exception($errMessage);
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
		});

		if ($data instanceof \phpseclib\Math\BigInteger) {
			$data = $data->toString();
		} else {
			$data = Q::json_encode($data, true);
		}

		$cache->result = $data;

		if (($data && $caching !== false)
		or (!$data && $caching === true)) {
			$cache->save(true);
		}

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
			'Users/Web3/getABIFilename', compact('contractAddress', 'appId'), 
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