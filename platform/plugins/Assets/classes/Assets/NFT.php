<?php

/**
 * @module Assets
 */
/**
 * Methods for manipulating "Assets/NFT" streams
 * @class Assets_NFT
 */
class Assets_NFT
{
	static $categoryStreamName = "Assets/user/NFTs";

	/**
	 * Check if NFT category exists, and create if not
	 * @method category
	 * @param {string} [$publisherId=null] If null - logged user id used.
	 */
	static function category($publisherId=null)
	{
		if ($publisherId === null) {
			$publisherId = Users::loggedInUser(true)->id;
		}
		if (empty($publisherId)) {
			throw new Q_Exception_WrongValue(array(
				'field' => 'publisherId',
				'range' => 'nonempty'
			));
		}

		$stream = Streams::fetchOne($publisherId, $publisherId, self::$categoryStreamName);
		if (!$stream) {
			$stream = Streams::create(null, $publisherId, 'Streams/category', array('name' => self::$categoryStreamName));
		}

		if ($stream->getAttribute('Assets/NFT/minted/total', null) === null) {
			$stream->setAttribute('Assets/NFT/minted/total', 0);
			$stream->changed();
		}

		return $stream;
	}

	/**
	 * Get or create new NFT empty stream for composer
	 * This is for user creating new NFT streams in the interface
	 * @method getComposerStream
	 * @param {string} [$userId=null] If null loggedin user id used
	 * @return {Streams_Stream}
	 */
	static function getComposerStream ($userId = null) {
		$userId = $userId ?: Users::loggedInUser(true)->id;
		$category = self::category($userId);

		$streams = Streams::related($userId, $userId, $category->name, true, array(
			"type" => "new",
			"streamsOnly" => true,
			"ignoreCache" => true
		));

		if (empty($streams)) {
			$stream = Streams::create($userId, $userId, "Assets/NFT", array(), array(
				"publisherId" => $userId,
				"streamName" => $category->name,
				"type" => "new"
			));
			$stream->join(compact("userId"));
			return $stream;
		} else {
			return reset($streams);
		}
	}

	/**
	 * Updated NFT stream with new data
	 * @method updateNFT
	 * @param {Streams_Stream} $stream NFT stream
	 * @param {array} $fields Array of data to update stream
	 * @return {Streams_Stream}
	 */
	static function updateNFT ($stream, $fields) {
		$communityId = Users::communityId();
		$userId = Users::loggedInUser(true)->id;

		$fieldsUpdated = false;
		foreach (array("title", "content") as $field) {
			if (!Q::ifset($fields, $field)) {
				continue;
			}

			$stream->{$field} = $fields[$field];
			$fieldsUpdated = true;
		}

		// update attributes
		if (Q::ifset($fields, "attributes")) {
			if ($stream->attributes) {
				$attributes = (array)Q::json_decode($stream->attributes);
			} else {
				$attributes = array();
			}
			$stream->attributes = Q::json_encode(array_merge($attributes, $fields["attributes"]));
		}

		if ($fieldsUpdated) {
			$stream->save();
		}

		$interestsRelationType = "NFT/interest";
		// remove relations
		$relateds = Streams_RelatedTo::select()->where(array(
			"type" => $interestsRelationType,
			"fromPublisherId" => $stream->publisherId,
			"fromStreamName" => $stream->name
		))->fetchDbRows();
		foreach ($relateds as $related) {
			Streams::unrelate($userId, $related->toPublisherId, $related->toStreamName, $interestsRelationType, $stream->publisherId, $stream->name);
		}

		if (!empty(Q::ifset($fields, "interests", null))) {
			foreach ($fields["interests"] as $key => $interest) {
				$interestStream = Streams::getInterest(trim($interest));
				$fields["interests"][$key] = $interestStream->name;
			}

			// relate to interests
			Streams::relate($userId, $communityId, $fields["interests"], $interestsRelationType, $stream->publisherId, $stream->name);
		}

		// change stream relation
		Streams::unrelate($userId, $stream->publisherId, self::$categoryStreamName, "new", $stream->publisherId, $stream->name);
		Streams::relate($userId, $stream->publisherId, self::$categoryStreamName, "Assets/NFT", $stream->publisherId, $stream->name, array("weight" => time()));

		//$onMarketPlace = Q::ifset($fields, "attributes", "onMarketPlace", null);
		//if ($onMarketPlace == "true") {
		// relate to main category
		Streams::relate($userId, $communityId, "Assets/NFTs", "NFT", $stream->publisherId, $stream->name, array("weight" => time()));
		//} elseif ($onMarketPlace == "false") {
		// unrelate from main category
		//	Streams::unrelate($userId, $communityId, "Assets/NFTs", "NFT", $stream->publisherId, $stream->name);
		//}

		return $stream;
	}

	/**
	 * Get currency by chainId and currency token
	 * @method getCurrencyByChain
	 * @static
	 * @param {String} $chainId
	 * @param {String} $currencyToken currency token
	 * @return array
	 */
	static function getCurrencyByChain ($chainId, $currencyToken) {
		$currencies = Q_Config::expect("Assets", "NFT", "currencies");
		foreach ($currencies as $currency) {
			if ($currency[$chainId] == $currencyToken) {
				return $currency;
			}
		}
	}

	/**
	 * Get available blockchain networks info (contact address, currency, rpcUrl, blockExplorerUrl)
	 * @method getChains
	 * @param {string} [$needChainId] if defined return only this chain info
	 * @static
	 * @return array
	 */
	static function getChains ($needChainId=null) {
		$chains = Q_Config::get("Users", "apps", "web3", array());
		$currencies = Q_Config::get("Assets", "NFT", "currencies", array());
		$chainsClient = array();
		foreach ($chains as $i => $chain) {
			// if contract or rpcUrls undefined, skip this chain
			$name = Q::ifset($chain, "name", null);
			$contract = Q::ifset($chain, "contracts", "NFT", "address", null);
			$factory = Q::ifset($chain, "contracts", "NFT", "factory", null);
			$factoryPath = null;
			$rpcUrl = Q::ifset($chain, "rpcUrl", null);
			$infuraId = Q::ifset($chain, "providers", "walletconnect", "infura", "projectId", null);
			$blockExplorerUrl = Q::ifset($chain, "blockExplorerUrl", null);
			$chainId = Q::ifset($chain, "appId", null);

			if (!$contract || !$rpcUrl) {
				continue;
			}

			$rpcUrl = Q::interpolate($rpcUrl, compact("infuraId"));
			$rpcUrls = array($rpcUrl);
			$temp = compact("name", "chainId", "contract", "contractJson", "factory", "factoryJson", "rpcUrls", "blockExplorerUrl");

			foreach ($currencies as $currency) {
				if ($currency[$chainId] == "0x0000000000000000000000000000000000000000") {
					$temp["currency"] = $currency;
					$temp["currency"]["token"] = $currency[$chainId];
					break;
				}
			}

			$temp["default"] = $i == Users::communityId();

			if ($needChainId && $chainId == $needChainId) {
				return $temp;
			}

			$chainsClient[$chainId] = $temp;
		}

		return $chainsClient;
	}

	/**
	 * Get default chain
	 * @method getDefaultChain
	 * @params {array} [$chains]
	 * @static
	 * @return array
	 */
	static function getDefaultChain ($chains = null) {
		$chains = $chains ?: self::getChains();
		foreach ($chains as $chain) {
			if (!$chain["default"]) {
				continue;
			}

			return $chain;
		}

		return null;
	}

	/**
	 * Get NFT json data
	 * @method getJson
	 * @param {String} $chainId
	 * @param {String} $contract
	 * @param {String} $tokenURI
	 * @param {Sreing} [$caching=true] If false, don't use cache, but real request and update cache.
	 * @param {Integer} [$cacheDuration=31536000] default 1 year
	 * @static
	 * @return array
	 */
	static function getJson ($chainId, $contract, $tokenURI, $caching=true, $cacheDuration=31536000) {
		$cache = Users_Web3::getCache($chainId, $contract, "getNFTJsonData", $tokenURI, $cacheDuration);
		if ($caching && $cache->wasRetrieved()) {
			return Q::json_decode($cache->result, true);
		}

		$response = Q_Utils::get($tokenURI, null, array(
			CURLOPT_SSL_VERIFYPEER => false,
			CURLOPT_SSL_VERIFYHOST => false
		));
		$cache->result = $response;
		$cache->save();

		return Q::json_decode($response, true);
	}

	/**
	 * Get NFT json data
	 * @method getJson
	 * @param {String} $chainId
	 * @param {String} $contractAddress
	 * @param {array} $wallets - array of wallet addresses
	 * @static
	 * @return array
	 */
	static function clearContractCache ($chainId, $contractAddress, $wallets) {
		$longDuration = 31104000;
		$tokensByOwnerLimit = Q_Config::get("Assets", "NFT", "methods", "tokensByOwner", "limit", 100);

		if (!is_array($wallets)) {
			$wallets = array($wallets);
		}

		foreach ($wallets as $wallet) {
			Users_Web3::getCache($chainId, $contractAddress, "tokensByOwner", array($wallet, $tokensByOwnerLimit), $longDuration)->remove();

			$balanceOfOwnerRow = Users_Web3::getCache($chainId, $contractAddress, "balanceOf", $wallet, $longDuration);
			if ($balanceOfOwnerRow->wasRetrieved()) {
				$balanceOfOwner = (int)Q::json_decode($balanceOfOwnerRow->result);
				$balanceOfOwnerRow->remove();
				for ($i = 0; $i < $balanceOfOwner; $i++) {
					Users_Web3::getCache($chainId, $contractAddress, "tokenOfOwnerByIndex", array($wallet, $i), $longDuration)->remove();
				}
			}
		}
	}
};