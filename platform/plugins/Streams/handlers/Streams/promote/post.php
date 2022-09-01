<?php

/**
 * Used to promote a stream to members of a community experience.
 * @module Streams
 * @class HTTP Streams/promote
 * @method post
 * @param {array} $_REQUEST
 * @param {string} $_REQUEST.publisherId Required. The id of the publisher of the stream.
 * @param {string} $_REQUEST.streamName Required. The name of the stream to promote.
 * @param {string} $_REQUEST.communityId Required. The user id of the community to promote to.
 * @param {string} [$_REQUEST.experienceId='main'] You can specify an experience to promote to
 * @param {string} $_REQUEST.relationType Required. The type of relation.
 * @return {slots} Sets the slot "relations".
 */

function Streams_promote_post()
{
	Q_Request::requireFields(array(
		'publisherId', 'streamName', 'communityId', 'relationType'
	), true);
	$publisherId = $_REQUEST['publisherId'];
	$streamName = $_REQUEST['streamName'];
	$communityId = $_REQUEST['communityId'];
	$relationType = $_REQUEST['relationType'];
	$experienceId = Q::ifset($_REQUEST, 'experienceId', 'main');
	$stream = Streams_Stream::fetch(null, $publisherId, $streamName, true);

	$roles = Users::roles($communityId, Q_Config::get('Communities', 'promote', 'labels', 'none'));
	if (empty($roles)) {
		throw new Users_Exception_NotAuthorized();
	}

	$o = array('weight' => $stream->getAttribute('startTime'), 'skipAccess' => true);

	$relations = array();
	$location = Places_Location::fromStream($stream);
	$latitude = $location['latitude'];
	$longitude = $location['longitude'];

	// NOTE: we need a way to add interests automatically
	$interests = Calendars_Event::getInterests($stream);

	$experience = Streams_Stream::fetch(
		null, $communityId, "Streams/experience/$experienceId", true
	);
	$co = array('experienceId' => $experienceId);
	if ($experience) {
		$stream->relateTo($experience, $relationType, null, $o);
	}
	$streamNames = array();
	if (isset($latitude) && isset($longitude)) {
		foreach ($interests as $interest) {
			$interest = (object)$interest;
			$relations['interest'] = $stream->relateTo($interest, $relationType, null, $o);

			Places_Interest::streams(
				$communityId,
				$latitude,
				$longitude,
				$interest->title,
				$co,
				$streamNames
			);
		}
		Places_Nearby::streams(
			$communityId,
			$latitude,
			$longitude,
			$co,
			$streamNames
		);
		Streams::relate(
			null,
			$communityId,
			$streamNames,
			$relationType,
			$stream->publisherId,
			$stream->name,
			$o
		);
	}

	Q_Response::setSlot('relations', $relations);
}