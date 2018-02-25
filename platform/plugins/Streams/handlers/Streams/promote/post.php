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
	$stream = Streams::fetchOne(null, $publisherId, $streamName, true);

	$roles = Users::roles($communityId);
	$app = Q::app();
	if (empty($roles["$app/admins"])) {
		throw new Users_Exception_NotAuthorized();
	}

	$o = array('weight' => $stream->getAttribute('startTime'), 'skipAccess' => true);

	$latitude = $longitude = null;

	$relations = array();
	if ($locationName = $stream->getAttribute('location', null)
	and $cid = $stream->getAttribute('communityId', null)) {
		$location = new Streams_Stream();
		$location->publisherId = $cid;
		$location->name = $locationName;
		if ($location->retrieve()) {
			$parts = explode('/', $locationName);
			$placeId = end($parts);
			$location = Places_Location::stream(null, $communityId, $placeId, true);
			$relations['location'] = $stream->relateTo($location, $relationType, null, $o);
			$latitude = $location->getAttribute('latitude');
			$longitude = $location->getAttribute('longitude');
		}
	}

	// NOTE: we need a way to add interests automatically
	if ($interestName = $stream->getAttribute('interest', null)) {
		$interest = new Streams_Stream();
		$interest->publisherId = $communityId;
		$interest->name = $interestName;
		if ($interest->retrieve()) {
			$relations['interest'] = $stream->relateTo($interest, $relationType, null, $o);
		}
	}

	$experience = Streams::fetchOne(
		null, $communityId, "Streams/experience/$experienceId", true
	);
	$co = array('experienceId' => $experienceId);
	if ($experience) {
		$stream->relateTo($experience, $relationType, null, $o);
	}
	$streamNames = array();
	if (isset($latitude) and isset($longitude)) {
		if ($interestTitle = $stream->getAttribute('interestTitle', null)) {
			Places_Interest::streams(
				$communityId,
				$latitude,
				$longitude,
				$interestTitle,
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