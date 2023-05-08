<?php

/**
 * @module Assets
 */
/**
 * Methods for manipulating "Assets/NFT/Collection" streams
 * @class Assets_NFT_Collection
 */
class Assets_NFT_Collections
{
	static $categoryStreamName = "Assets/NFT/collections";
	static $relationType = "Assets/NFT/collection";
	static $streamType = "Assets/NFT/collection";

	/**
	 * Get or create new NFT empty stream for composer
	 * @method getComposerStream
	 * @param {string} [$userId=null] If null loggedin user id used
	 * @return {Streams_Stream}
	 */
	static function getComposerStream ($userId=null) {
		$userId = $userId ?: Users::loggedInUser(true)->id;
		$communityId = Users::communityId();

		$relations = Streams_RelatedTo::select()->where(array(
			"toPublisherId" => $communityId,
			"toStreamName" => self::$categoryStreamName,
			"type" => "new",
			"fromPublisherId" => $userId
		))->ignoreCache()->fetchDbRows();

		if (!empty($relations)) {
			$relation = reset($relations);
			$stream = Streams_Stream::fetch($relation->fromPublisherId, $relation->fromPublisherId, $relation->fromStreamName);
			return $stream;
		}

		$data = Q::event("Users/external/response/data", array("userId"));
		$stream = Streams::create($userId, $userId, self::$streamType, array(), array(
			"publisherId" => $communityId,
			"streamName" => self::$categoryStreamName,
			"type" => "new"
		));
		$maxWeight = Streams_RelatedTo::select()->where(array(
			"toPublisherId" => $communityId,
			"toStreamName" => self::$categoryStreamName,
			"type" => self::$relationType
		))->orderBy("weight", false)->limit(1)->fetchDbRow();
		$maxWeight = $maxWeight ? (int)$maxWeight->weight : 0;
		$lastPart = explode("/", $stream->name);
		$lastPart = end($lastPart);
		$tokenId = Streams::toHexString($userId, "$maxWeight/$lastPart");
		$tokenId = preg_replace("/0+$/", "", $tokenId);
		$collectionId = substr($tokenId, 0, 18);
		$stream->setAttribute("tokenId", $tokenId);
		$stream->setAttribute("collectionId", $collectionId);
		$stream->save();

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
			$fieldsUpdated = true;
		} else {
			$stream->attributes = '{}';
		}

		if ($fieldsUpdated) {
			$stream->changed();
		}

		// check if new
		$relation = Streams_RelatedTo::select()->where(array(
			"fromPublisherId" => $stream->publisherId,
			"fromStreamName" => $stream->name,
			"type" => "new",
			"toStreamName" => self::$categoryStreamName
		))->fetchDbRow();
		if ($relation) {
			$category = Streams_Stream::fetch($relation->toPublisherId, $relation->toPublisherId, $relation->toStreamName, true);

			// change stream relation
			Streams::unrelate($userId, $category->publisherId, $category->name, "new", $stream->publisherId, $stream->name, array("skipAccess" => true));
			Streams::relate($userId, $category->publisherId, $category->name, self::$relationType, $stream->publisherId, $stream->name, array("weight" => "+1", "skipAccess" => true));
		}

		return $stream;
	}
};