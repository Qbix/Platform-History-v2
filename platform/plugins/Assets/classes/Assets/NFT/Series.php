<?php

/**
 * @module Assets
 */
/**
 * Methods for manipulating "Assets/NFT/Series" streams
 * @class Assets_NFT_Series
 */
class Assets_NFT_Series
{
	static $relationType = "Assets/NFT/series/{{contract}}";
	static $userSeriesCategoryStreamName = "Assets/NFT/series";
	static $userSeriesCategoryRelationType = "Assets/NFT/series";

	/**
	 * Check if NFT/series category exists, and create if not
	 * @method category
	 * @param {string} $chainId - chain id for which series created
	 * @param {string} [$publisherId=null] - If null, logged user id used.
	 */
	static function category($chainId, $publisherId=null)
	{
		if ($publisherId === null) {
			$publisherId = Users::loggedInUser(true)->id;
		}

		$streamName = Q::interpolate(Assets_NFT_Contract::$streamName, compact("chainId"));
		$stream = Streams::fetchOne($publisherId, $publisherId, $streamName);
		if (!$stream) {
			throw new Exception($streamName." stream not found");
		}
		if (!$stream->getAttribute("contract")) {
			throw new Exception("contract address not found in ".$streamName." stream");
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
	 * @param {string} $chainId
	 * @param {Streams_Stream} $category - contract stream, which is category for series streams
	 * @param {string} [$userId=null] If null loggedin user id used
	 * @return {Streams_Stream}
	 */
	static function getComposerStream ($chainId, $category, $userId = null) {
		$userId = $userId ?: Users::loggedInUser(true)->id;

		$relations = Streams_RelatedTo::select()->where(array(
			"toPublisherId" => $category->publisherId,
			"toStreamName" => $category->name,
			"type" => "new"
		))->ignoreCache()->fetchDbRows();

		if (empty($relations)) {
			$data = Q::event("Users/external/response/data", array("userId"));
			$stream = Streams::create($userId, $userId, "Assets/NFT/series", array(
				"attributes" => array(
					"chainId" => $chainId,
					"author" => $data["wallet"]
				)
			), array(
				"publisherId" => $category->publisherId,
				"streamName" => $category->name,
				"type" => "new"
			));
			$maxWeight = Streams_RelatedTo::select()->where(array(
				"toPublisherId" => $userId,
				"toStreamName" => self::$userSeriesCategoryStreamName,
				"type" => self::$userSeriesCategoryRelationType
			))->orderBy("weight", false)->limit(1)->fetchDbRow();
			$maxWeight = $maxWeight ? (int)$maxWeight->weight : 0;
			$lastPart = explode("/", $stream->name);
			$lastPart = end($lastPart);
			$seriesId = Streams::toHexString($userId, "$maxWeight/$lastPart");
			$seriesId = preg_replace("/0+$/", "", $seriesId);
			$stream->setAttribute("seriesId", $seriesId)->save();

			$stream->join(compact("userId"));
			return $stream;
		} else {
			$relation = reset($relations);
			return Streams::fetchOne($relation->fromPublisherId, $relation->fromPublisherId, $relation->fromStreamName);
		}
	}

	/**
	 * Get current series stream for a user
	 * @method getCurrentStream
	 * @param {string} [$userId=null] If null loggedin user id used
	 * @param {boolean} [$throwIfNotFound=false] - it true throw exception if stream absent
	 * @return {Streams_Stream}
	 */
	static function getCurrentStream ($userId = null, $throwIfNotFound=false) {
		$userId = $userId ?: Users::loggedInUser(true)->id;

		$contract = Assets_NFT_Contract::getCurrent($userId);
		if (!$contract) {
			if ($throwIfNotFound) {
				throw new Exception("User have no contract selected");
			}
			return null;
		}

		$relations = Streams_RelatedTo::select()->where(array(
			"toPublisherId" => $contract->publisherId,
			"toStreamName" => $contract->name,
			"type" => "new"
		))->ignoreCache()->fetchDbRows();

		if (empty($relations)) {
			if ($throwIfNotFound) {
				throw new Exception("User have no contract selected");
			}
			return null;
		} else {
			$relation = reset($relations);
			return Streams::fetchOne($relation->fromPublisherId, $relation->fromPublisherId, $relation->fromStreamName, $throwIfNotFound ?: "*");
		}
	}

	/**
	 * Updated NFT stream with new data
	 * @method update
	 * @param {Streams_Stream} $stream - NFT stream
	 * @param {array} $fields - Array of data to update stream
	 * @return {Streams_Stream}
	 */
	static function update ($stream, $fields) {
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
			$fieldsUpdated = true;
		}

		if ($fieldsUpdated) {
			$stream->save();
		}

		// check if new
		$relation = Streams_RelatedTo::select()->where(array(
			"fromPublisherId" => $stream->publisherId,
			"fromStreamName" => $stream->name,
			"type" => "new",
			"toStreamName" => "Assets/NFT/contract/".$stream->getAttribute("chainId")
		))->fetchDbRow();
		if ($relation) {
			$category = Streams::fetchOne($relation->toPublisherId, $relation->toPublisherId, $relation->toStreamName, true);
			$contract = $category->getAttribute("contract");
			if (!$contract) {
				throw new Exception("Factory address not found");
			}

			// change stream relation
			Streams::unrelate($userId, $category->publisherId, $category->name, "new", $stream->publisherId, $stream->name);
			Streams::relate($userId, $category->publisherId, $category->name, Q::interpolate(self::$relationType, compact("contract")), $stream->publisherId, $stream->name, array("weight" => time()));
			Streams::relate($userId, $stream->publisherId, self::$userSeriesCategoryStreamName, self::$userSeriesCategoryRelationType, $stream->publisherId, $stream->name, array("weight" => "+1"));
		}

		//$onMarketPlace = Q::ifset($fields, "attributes", "onMarketPlace", null);
		//if ($onMarketPlace == "true") {
		// relate to main category
		//Streams::relate($userId, $communityId, "Assets/NFTs", "NFT", $stream->publisherId, $stream->name, array("weight" => time()));
		//} elseif ($onMarketPlace == "false") {
		// unrelate from main category
		//	Streams::unrelate($userId, $communityId, "Assets/NFTs", "NFT", $stream->publisherId, $stream->name);
		//}

		return $stream;
	}
};