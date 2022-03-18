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
	static $categoryStreamName = "Assets/user/NFT/series";

	/**
	 * Check if NFT/series category exists, and create if not
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
			$stream = Streams::create($userId, $userId, "Assets/NFT/series", array(), array(
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
	 * @method update
	 * @param {Streams_Stream} $stream NFT stream
	 * @param {array} $fields Array of data to update stream
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
		$chainId = null;
		if (Q::ifset($fields, "attributes")) {
			$chainId = Q::ifset($fields, "attributes", "chainId", null);
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

		// change stream relation
		Streams::unrelate($userId, $stream->publisherId, self::$categoryStreamName, "new", $stream->publisherId, $stream->name);
		Streams::relate($userId, $stream->publisherId, self::$categoryStreamName, "Assets/NFT/series", $stream->publisherId, $stream->name, array("weight" => time()));
		if ($chainId) {
			Streams::relate($userId, $stream->publisherId, self::$categoryStreamName, "Assets/NFT/series/".$chainId, $stream->publisherId, $stream->name, array("weight" => time()));
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