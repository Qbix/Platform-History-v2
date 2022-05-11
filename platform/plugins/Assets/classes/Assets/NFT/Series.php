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
	static $categoryStreamName = "Assets/NFT/series";
	static $relationType = "Assets/NFT/series";
	static $streamType = "Assets/NFT/series";

	/**
	 * Get or create new NFT empty stream for composer
	 * @method getComposerStream
	 * @param {string} [$userId=null] If null loggedin user id used
	 * @return {Streams_Stream}
	 */
	static function getComposerStream ($userId=null) {
		$userId = $userId ?: Users::loggedInUser(true)->id;

		$relations = Streams_RelatedTo::select()->where(array(
			"toPublisherId" => $userId,
			"toStreamName" => self::$categoryStreamName,
			"type" => "new"
		))->ignoreCache()->fetchDbRows();

		if (!empty($relations)) {
			$relation = reset($relations);
			$stream = Streams::fetchOne($relation->fromPublisherId, $relation->fromPublisherId, $relation->fromStreamName);
			return $stream;
		}

		$data = Q::event("Users/external/response/data", array("userId"));
		$stream = Streams::create($userId, $userId, "Assets/NFT/series", array(
			"attributes" => array(
				"author" => $data["wallet"]
			)
		), array(
			"publisherId" => $userId,
			"streamName" => self::$categoryStreamName,
			"type" => "new"
		));
		$maxWeight = Streams_RelatedTo::select()->where(array(
			"toPublisherId" => $userId,
			"toStreamName" => self::$categoryStreamName,
			"type" => self::$relationType
		))->orderBy("weight", false)->limit(1)->fetchDbRow();
		$maxWeight = $maxWeight ? (int)$maxWeight->weight : 0;
		$lastPart = explode("/", $stream->name);
		$lastPart = end($lastPart);
		$tokenId = Streams::toHexString($userId, "$maxWeight/$lastPart");
		$tokenId = preg_replace("/0+$/", "", $tokenId);
		$seriesId = substr($tokenId, 0, 18);
		$stream->setAttribute("tokenId", $tokenId)->save();
		$stream->setAttribute("seriesId", $seriesId)->save();

		$stream->join(compact("userId"));
		return $stream;
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
		if (Q::ifset($fields, "attributes", null)) {
			if ($stream->attributes) {
				$attributes = (array)Q::json_decode($stream->attributes);
			} else {
				$attributes = array();
			}
			$stream->attributes = Q::json_encode(array_merge($attributes, $fields["attributes"]));
			$fieldsUpdated = true;
		} else {
			$stream->attributes = '{}';
		}

		if ($fieldsUpdated) {
			$stream->save();
		}

		// check if new
		$relation = Streams_RelatedTo::select()->where(array(
			"fromPublisherId" => $stream->publisherId,
			"fromStreamName" => $stream->name,
			"type" => "new",
			"toStreamName" => self::$categoryStreamName
		))->fetchDbRow();
		if ($relation) {
			$category = Streams::fetchOne($relation->toPublisherId, $relation->toPublisherId, $relation->toStreamName, true);

			// change stream relation
			Streams::unrelate($userId, $category->publisherId, $category->name, "new", $stream->publisherId, $stream->name);
			Streams::relate($userId, $stream->publisherId, self::$categoryStreamName, self::$relationType, $stream->publisherId, $stream->name, array("weight" => "+1"));
		}

		return $stream;
	}
};