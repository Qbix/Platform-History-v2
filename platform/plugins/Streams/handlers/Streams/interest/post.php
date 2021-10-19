<?php

/**
 * @module Streams
 * @class HTTP Streams interest
 */

/**
 * Used by HTTP clients to create a new interest in the system.
 * @method post
 *
 * @param {array} $_REQUEST 
 * @param {string} [$_REQUEST.title] Required. The title of the interest.
 * @param {string} [$_REQUEST.publisherId=Users::communityId()] Optional. Defaults to the current community's id.
 * @param {string} [$_REQUEST.subscribe] Optional. Defauls to false. Whether to subscribe rather than just join the interest stream.
 * @return {void}
 */
function Streams_interest_post($params = array())
{
	$r = array_merge($_REQUEST, $params);

	// userId can defined only from $params for security reasons
	$userId = Q::ifset($params, 'userId', Users::loggedInUser(true)->id);

	$title = Q::ifset($r, 'title', null);
	if (!isset($title)) {
		throw new Q_Exception_RequiredField(array('field' => 'title'));
	}

	$publisherId = Q::ifset($r, 'publisherId', Users::communityId());

	$stream = Streams::getInterest($title);

	$subscribe = !!Q::ifset($r, 'subscribe', false);
	if ($subscribe) {
		$stream->subscribe(array('userId' => $userId));
	} else {
		$stream->join(array('userId' => $userId));
	}
	
	$myInterestsName = 'Streams/user/interests';
	$myInterests = Streams::fetchOne($userId, $userId, $myInterestsName);
	if (!$myInterests) {
		$myInterests = new Streams_Stream();
		$myInterests->publisherId = $userId;
		$myInterests->name = $myInterestsName;
		$myInterests->type = 'Streams/category';
		$myInterests->title = 'My Interests';
		$myInterests->save();
	}
	
	Streams::relate(
		$userId,
		$userId,
		'Streams/user/interests',
		'Streams/interests',
		$publisherId,
		$stream->name,
		array('weight' => '+1')
	);
	
	Q_Response::setSlot('publisherId', $publisherId);
	Q_Response::setSlot('streamName', $stream->name);

	/**
	 * Occurs when the logged-in user has successfully added an interest via HTTP
	 * @event Streams/interest/post {after}
	 * @param {string} publisherId The publisher of the interest stream
	 * @param {string} title The title of the interest
	 * @param {boolean} subscribe Whether the user subscribed to the interest stream
	 * @param {Users_User} user The logged-in user
	 * @param {Streams_Stream} stream The interest stream
	 * @param {Streams_Stream} myInterests The user's "Streams/user/interests" stream
	 */
	Q::event("Streams/interest/add", @compact(
		'publisherId', 'title', 'subscribe', 'userId', 'stream', 'myInterests'
	), 'after');
}