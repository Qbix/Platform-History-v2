<?php

/**
 * @module Assets
 */
/**
 * Methods for manipulating "Assets/NFT/Contract" streams
 * @class Assets_NFT_Contract
 */
class Assets_NFT_Contract
{
	static $categoryStreamName = "Assets/NFT/contracts";
	static $streamName = "Assets/NFT/contract/{{chainId}}";
	static $relationType = "Assets/NFT/contract";

	/**
	 * Check if Assets/NFT/contracts category exists, and create if not
	 * @method category
	 * @param {string} [$publisherId=null] - If null, logged user id used.
	 */
	static function category($publisherId=null)
	{
		if ($publisherId === null) {
			$publisherId = Users::loggedInUser(true)->id;
		}

		$stream = Streams_Stream::fetchOrCreate($publisherId, $publisherId, self::$categoryStreamName, array("type" => 'Streams/category'));

		return $stream;
	}

	/**
	 * Get current contract stream for a user
	 * @method getCurrent
	 * @param {string} [$userId=null] If null loggedin user id used
	 * @param {boolean} [$throwIfNotFound=false] - it true throw exception if stream absent
	 * @return {Streams_Stream}
	 */
	static function getCurrent ($userId=null, $throwIfNotFound=false) {
		$userId = $userId ?: Users::loggedInUser(true)->id;

		$category = self::category($userId);
		$relations = Streams_RelatedTo::select()->where(array(
			"toPublisherId" => $category->publisherId,
			"toStreamName" => $category->name,
			"type" => self::$relationType
		))->ignoreCache()->fetchDbRows();

		if (empty($relations)) {
			if ($throwIfNotFound) {
				throw new Exception("Custom contract stream for $userId not found");
			}
			return null;
		}

		$relation = reset($relations);
		return Streams_Stream::fetch($relation->fromPublisherId, $relation->fromPublisherId, $relation->fromStreamName, $throwIfNotFound ?: "*");
	}

	/**
	 * Get custom contract stream by user and chain id
	 * @method getStream
	 * @param {Srtring} $chainId
	 * @param {string} [$userId=null] If null loggedin user id used
	 * @param {boolean} [$throwIfNotFound=false] - it true throw exception if stream absent
	 * @throws Exception
	 * @return {Streams_Stream}
	 */
	static function getStream ($chainId, $userId=null, $throwIfNotFound=false) {
		$userId = $userId ?: Users::loggedInUser(true)->id;
		$streamName = Q::interpolate(self::$streamName, array("chainId" => $chainId));
		$stream = Streams_Stream::fetch(null, $userId, $streamName);
		if (!$stream && $throwIfNotFound) {
			throw new Exception("Stream $userId : $streamName not found");
		}

		return $stream;
	}
};