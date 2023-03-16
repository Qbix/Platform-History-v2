<?php
require_once Q_PLUGIN_DIR.DS.'vendor'.DS.'autoload.php';

/**
 * @module Assets
 */
/**
 * Methods for manipulating "Assets/NFT" streams
 * @class Assets_NFT
 */
class Assets_Currency_Web3 {

	/**
	 * Get tokens balance (native and/or custom) by chain and wallet
	 * @method balances
	 * @param {string} $chainId
	 * @param {string} $walletAddress
	 * @param {string|array} [$tokenAddresses] - custom token address. If this address provided, will be return only this token balance, otherwise all tokens balance.
	 */
	static function balances($chainId, $walletAddress, $tokenAddresses=null) {
		return Assets_Web3_Moralis::getBalance($chainId, $walletAddress, $tokenAddresses);
	}
};