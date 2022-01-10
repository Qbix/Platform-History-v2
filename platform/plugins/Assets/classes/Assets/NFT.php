<?php

/**
 * @module Assets
 */
/**
 * Methods for manipulating "Assets/NFT" streams
 * @class Assets_NFT
 */
class Assets_NFT extends Base_Assets_Credits
{
    /**
	 * Check if NFT category exists, and create if not
	 * @method category
	 * @param string [$publisherId=null] If null - logged user id used.
	 */
	static function category($publisherId)
	{
		if ($publisherId === null) {
			$publisherId = Users::loggedInUser(true)->id;
		}

		$streamName = "Assets/user/NFTs";
		$stream = Streams::fetchOne($publisherId, $publisherId, $streamName);
		if (!$stream) {
			Streams::create(null, $publisherId, 'Streams/category', array('name' => $streamName));
		}

		if ($stream->getAttribute('Assets/NFT/minted/total', null) === null) {
			$stream->setAttribute('Assets/NFT/minted/total', 0);
			$stream->changed();
		}

		return $stream;
	}

    /**
	 * Get or create new NFT empty stream for composer
	 * @method stream
	 * @param {string} [$userId=null] If null loggedin user id used
	 * @return {Streams_Stream}
	 */
	static function stream ($userId = null) {
		$userId = $userId ?: Users::loggedInUser(true)->id;
		self::category($userId);

		$stream = Streams::related($userId, $userId, $streamName, true, array(
			"type" => "new",
			"streamsOnly" => true,
			"ignoreCache" => true
		));

		if (empty($stream)) {
			return Streams::create($userId, $userId, "Assets/NFT", array(), array(
				"publisherId" => $userId,
				"streamName" => $category->name,
				"type" => "new"
			));
		} else {
			return reset($stream);
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
		$categoryStreamName = "Assets/user/NFTs";
		Streams::unrelate($userId, $stream->publisherId, $categoryStreamName, "new", $stream->publisherId, $stream->name);
		Streams::relate($userId, $stream->publisherId, $categoryStreamName, "NFT", $stream->publisherId, $stream->name, array("weight" => time()));

		$onMarketPlace = Q::ifset($fields, "attributes", "onMarketPlace", null);
		if ($onMarketPlace == "true") {
			// relate to main category
			Streams::relate($userId, $communityId, "Assets/NFTs", "NFT", $stream->publisherId, $stream->name, array("weight" => time()));
		} elseif ($onMarketPlace == "false") {
			// unrelate from main category
			Streams::unrelate($userId, $communityId, "Assets/NFTs", "NFT", $stream->publisherId, $stream->name);
		}

		return $stream;
	}

};