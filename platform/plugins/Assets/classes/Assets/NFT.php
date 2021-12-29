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
	 * @method checkCategory
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
};