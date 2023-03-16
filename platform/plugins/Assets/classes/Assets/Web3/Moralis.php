<?php
require_once Q_PLUGIN_DIR.DS.'vendor'.DS.'autoload.php';

/**
 * @module Assets
 */
/**
 * Methods for manipulating Moralis API
 * @class Assets_NFT
 */
class Assets_Web3_Moralis {

	static private $API_KEY;
	static private $END_POINTS;

	static private function constructor () {
		self::$API_KEY = Q_Config::expect("Assets", "moralis", "apiKey");
		self::$END_POINTS = Q_Config::expect("Assets", "moralis", "endPoints");
	}

	/**
	 * Get tokens balance (native and/or custom) by chain and wallet
	 * @method getBalance
	 * @param {string} $chainId
	 * @param {string} $walletAddress
	 * @param {string|array} [$tokenAddresses] - custom token address. If this address provided, will be return only this token balance, otherwise all tokens balance.
	 */
	static function getBalance($chainId, $walletAddress, $tokenAddresses=null) {
		self::constructor();

		$result = array();
		$encodedTokenAddress = "";
		if ($tokenAddresses) {
			if (gettype($tokenAddresses) == "string") {
				$encodedTokenAddress = "&token_addresses=".$tokenAddresses;
			} elseif (is_array($tokenAddresses)) {
				foreach ($tokenAddresses as $i => $tokenAddress) {
					$encodedTokenAddress .= "&token_addresses[]=".$tokenAddress;
				}
			}
		}

		foreach (array("native", "ERC20") as $point) {
			if ($tokenAddresses) {
				if ($point == "native") {
					continue;
				}
			}

			$apiEndPoint = Q::interpolate(self::$END_POINTS[$point], array(
				"walletAddress" => $walletAddress,
				"chainId" => $chainId,
				"tokenAddresses" => $encodedTokenAddress
			));
			$client = new \GuzzleHttp\Client();
			$response = $client->request('GET', $apiEndPoint, array(
				'headers' => array (
					'Accept' => 'application/json',
					'X-API-Key' => self::$API_KEY
				)
			));

			$response = json_decode($response->getBody()->getContents(), true);
			if ($point == "native") {
				$nativeCurrencyInfo = Q_Config::expect("Users", "web3", "chains", $chainId, "currency");
				$response = array(array_merge(array(
					"name" => $nativeCurrencyInfo["name"],
					"symbol" => $nativeCurrencyInfo["symbol"],
					"decimals" => 18,
					"token" => "0x0000000000000000000000000000000000000000"

				), $response));
			}
			$result = array_merge($result, $response);
		}

		return $result;
	}
};