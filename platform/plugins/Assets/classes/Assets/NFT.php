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
			if (!Q::ifset($fields, $field, null)) {
				continue;
			}

			$stream->{$field} = $fields[$field];
			$fieldsUpdated = true;
		}

		// update attributes
		if (Q::ifset($fields, "attributes", null)) {
			if ($stream->attributes) {
				$attributes = (array)Q::json_decode($stream->attributes);
			} else {
				$attributes = array();
			}
			$stream->attributes = Q::json_encode(array_merge($attributes, $fields["attributes"]));
		}

		if ($fieldsUpdated) {
			$stream->save();
			if (Q::ifset($fields, "attributes", "Assets/NFT/attributes", null)) {
				self::updateAttributesRelations($stream);
			}
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
			$default = $i == Q::app();
			$contract = Q::ifset($chain, "contracts", "NFT", "address", null);
			$bulkContract = Q::ifset($chain, "contracts", "bulkContract", "address", null);
			$factory = Q::ifset($chain, "contracts", "NFT", "factory", null);
			$factoryPath = null;
			$rpcUrl = Q::ifset($chain, "rpcUrl", null);
			$infuraId = Q::ifset($chain, "providers", "walletconnect", "infura", "projectId", null);
			$blockExplorerUrl = Q::ifset($chain, "blockExplorerUrl", null);
			$chainId = Q::ifset($chain, "appId", null);

			if (!$rpcUrl) {
				continue;
			}

			$rpcUrl = Q::interpolate($rpcUrl, compact("infuraId"));
			$rpcUrls = array($rpcUrl);
			$blockExplorerUrls = array($blockExplorerUrl);
			$temp = compact("name", "chainId", "contract", "bulkContract", "default", "factory", "rpcUrls", "blockExplorerUrls");

			foreach ($currencies as $currency) {
				if (Q::ifset($currency, $chainId, null) == "0x0000000000000000000000000000000000000000") {
					$temp["currency"] = $currency;
					$temp["currency"]["token"] = $currency[$chainId];
					break;
				}
			}

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
			if ($chain["default"]) {
				return $chain;
			}
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
	 * Clear cache related to contract
	 * @method clearContractCache
	 * @param {String} $chainId
	 * @param {String} $contractAddress
	 * @param {array} $wallets - array of wallet addresses
	 * @static
	 * @return array
	 */
	static function clearContractCache ($chainId, $contractAddress, $wallets) {
		$longDuration = 31104000; // seconds in a year
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

	/**
	 * Replace all relations with only one relation
	 * @method replaceAllRelationsWithOne
	 * @param {Streams_Stream} $category - category stream
	 * @param {String} $relationType
	 * @param {Streams_stream} $stream - stream to relate to category
	 * @static
	 */
	static function replaceAllRelationsWithOne ($category, $relationType, $stream) {
		$relatedStreams = Streams_RelatedTo::select()->where(array(
			"toPublisherId" => $category->publisherId,
			"toStreamName" => $category->name,
			"type" => $relationType
		))->fetchDbRows();
		foreach ($relatedStreams as $relation) {
			Streams::unrelate(null, $relation->toPublisherId, $relation->toStreamName, $relation->type, $relation->fromPublisherId, $relation->fromStreamName, array(
				"skipAccess" => true,
				"skipMessageTo" => true,
				"skipMessageFrom" => true
			));
		}
		Streams::relate(null, $category->publisherId, $category->name, $relationType, $stream->publisherId, $stream->name, array(
			"skipAccess" => true,
			"skipMessageTo" => true,
			"skipMessageFrom" => true,
			"ignoreCache" => true
		));
	}

	/**
	 * Add/remove attributes relations of NFT to category
	 * @method updateRelations
	 * @static
	 * @return {Assets_NftAttributes} Class instance
	 */
	static function updateAttributesRelations ($stream) {
		$category = self::category($stream->publisherId);
		$relations = Streams_RelatedTo::select()->where(array(
			"toPublisherId" => $category->publisherId,
			"toStreamName" => $category->name,
			"fromPublisherId" => $stream->publisherId,
			"fromStreamName" => $stream->name,
			"type like " => "attribute/%"
		))->fetchDbRows();

		$prevDbCaching = Db::allowCaching(false);

		// unrelate all attributes relations
		foreach ($relations as $relation) {
			Streams::unrelate(null, $relation->toPublisherId, $relation->toStreamName, $relation->type, $relation->fromPublisherId, $relation->fromStreamName);
		}

		// relate all attributes relations
		$nftAttributes = $stream->getAttribute("Assets/NFT/attributes", array());
		foreach ($nftAttributes as $nftAttribute) {
			$normalizedAttributeName = Q_Utils::normalize($nftAttribute["trait_type"]);
			$normalizedAttributeValue = Q_Utils::normalize($nftAttribute["value"]);
			$weight = time();
			if (empty($nftAttribute["display_type"]) || $nftAttribute["display_type"] == "string") {
				$relationType = implode("/", array("attribute", $normalizedAttributeName, $normalizedAttributeValue));
			} else {
				$relationType = implode("/", array("attribute", $normalizedAttributeName));
				$weight = $normalizedAttributeValue;
			}
			$stream->relateTo($category, $relationType, null, array(
				'skipAccess' => true,
				'weight' => $weight
			));
		}

		Db::allowCaching($prevDbCaching);
	}
};