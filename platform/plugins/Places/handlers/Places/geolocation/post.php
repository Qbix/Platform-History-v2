<?php

/**
 * @module Places
 */

/**
 * Used to set the user's location from geolocation data.
 * @class HTTP Places geolocation
 * @method post
 * @param $_REQUEST
 * @param {double} [$_REQUEST.latitude] The new latitude. If set, must also specify longitude.
 * @param {double} [$_REQUEST.longitude] The new longitude. If set, must also specify latitude.
 * @param {string} [$_REQUEST.postcode] The new zip code. Can be set instead of latitude, longitude.
 * @param {double} [$_REQUEST.meters] The distance around their location around that the user is interested in
 * @param {Number} [$_REQUEST.joinNearby=0] Pass 1 to join to the Places/nearby stream at the new location. Pass 2 to join and subscribe.
 * @param {Number} [$_REQUEST.leaveNearby=0] Pass 1 to unsubscribe from the Places/nearby stream at the old location. Pass 2 to unsubscribe and leave.
 * @param {Number} [$_REQUEST.joinInterests=0] Pass 1 to join to all the local interests at the new location. Pass 2 to join and subscribe.
 * @param {Number} [$_REQUEST.leaveInterests=0] Whether to unsubscribe from all the local interests at the old location. Pass 2 to unsubscribe and leave.
 * @param {double} [$_REQUEST.accuracy]
 * @param {double} [$_REQUEST.altitude]
 * @param {double} [$_REQUEST.altitudeAccuracy]
 * @param {double} [$_REQUEST.heading]
 * @param {double} [$_REQUEST.speed]
 * @param {integer} [$_REQUEST.timezone]
 * @param {string} [$_REQUEST.placeName] optional
 * @param {string} [$_REQUEST.state] optional
 * @param {string} [$_REQUEST.country] optional
 */
function Places_geolocation_post()
{
	$user = Users::loggedInUser(true);
	$stream = Places_Location::userStream();
	$oldLatitude = $stream->getAttribute('latitude');
	$oldLongitude = $stream->getAttribute('longitude');
	$oldMeters = $stream->getAttribute('meters');
	$fields = array(
		'accuracy',
		'altitude',
		'altitudeAccuracy',
		'heading',
		'latitude',
		'longitude',
		'speed',
		'meters',
		'postcode',
		'timezone',
		'placeName',
		'state',
		'country'
	);
	$attributes = Q::take($_REQUEST, $fields);
	if (isset($attributes['timezone'])) {
		$attributes['timezone'] = floatval($attributes['timezone']);
	}
	if (isset($attributes['latitude'])
	xor isset($attributes['longitude'])) {
		throw new Q_Exception(
			"When specifying latitude,longitude you must specify both",
			array('latitude', 'longitude')
		);
	}
	if (!empty($attributes['postcode']) and !isset($attributes['latitude'])) {
		$z = new Places_Postcode();
		$z->countryCode = 'US';
		$z->postcode = $attributes['postcode'];
		if ($z->retrieve()) {
			$attributes['latitude'] = $z->latitude;
			$attributes['longitude'] = $z->longitude;
			$attributes['country'] = $z->countryCode;
		} else {
			throw new Q_Exception_MissingRow(array(
				'table' => 'postcode',
				'criteria' => $attributes['postcode']
			), 'postcode');
		}
	}
	$attributes['meters'] = floatval(Q::ifset($attributes, 'meters', 
		$stream->getAttribute(
			'meters',
			Q_Config::expect('Places', 'nearby', 'defaultMeters')
		)
	));
	if (empty($attributes['postcode']) and isset($attributes['latitude'])) {
		$postcodes = Places_Postcode::nearby(
			floatval($attributes['latitude']),
			floatval($attributes['longitude']),
			floatval($attributes['meters']),
			1
		);
		if ($postcode = $postcodes ? reset($postcodes) : null) {
			$attributes['postcode'] = $postcode->postcode;
			$attributes['placeName'] = $postcode->placeName;
			$attributes['state'] = $postcode->state;
			$attributes['country'] = $postcode->countryCode;
		}
	}
	$stream->setAttribute($attributes);
	$stream->changed();
	$stream->post($user->id, array(
		'type' => 'Places/location/updated',
		'content' => '',
		'instructions' => $stream->getAllAttributes()
	), true);
	
	$leaveNearby = isset($oldMeters) ? Q::ifset($_REQUEST, 'leaveNearby', 0) : 0;
	$joinNearby = Q::ifset($_REQUEST, 'joinNearby', 0);
	$leaveInterests = isset($oldMeters) ? Q::ifset($_REQUEST, 'leaveInterests', 0) : 0;
	$joinInterests = Q::ifset($_REQUEST, 'joinInterests', 0);
	$noChange = false;

	$latitude = $stream->getAttribute('latitude');
	$longitude = $stream->getAttribute('longitude');
	$meters = $stream->getAttribute('meters');

	if (abs($latitude - $oldLatitude) < 0.0001
	and abs($longitude - $oldLongitude) < 0.0001
	and abs($meters - $oldMeters) < 0.001) {
		$noChange = true;
	}
	
	$attributes['stream'] = $stream;
	Q_Response::setSlot('attributes', $attributes);

	if (!$noChange) {
		// Send the response and keep going.
		// WARN: this potentially ties up the PHP thread for a long time
		$timeLimit = Q_Config::get('Places', 'geolocation', 'timeLimit', 100000);
		ignore_user_abort(true);
		set_time_limit($timeLimit);
		Q_Dispatcher::response(true);
		session_write_close();
		
		if ($leaveInterests or $joinInterests) {
			$myInterests = Streams_Category::getRelatedTo(
				$user->id, 'Streams/user/interests', 'Streams/interests'
			);
			if (!isset($myInterests)) {
				$myInterests = array();
			}
		}

		if ($leaveInterests and $oldLatitude and $oldLongitude and $oldMeters) {
			$results = array();
			foreach ($myInterests as $weight => $info) {
				$publisherId = $info[0];
				if (!isset($results[$publisherId])) {
					$results[$publisherId] = array();
				}
				$results[$publisherId] = array_merge(
					$results[$publisherId], Places_Interest::streams(
						$publisherId, $oldLatitude, $oldLongitude, $info[2], array(
							'meters' => $oldMeters,
							'skipAccess' => true,
							'forSubscribers' => true
						)
					)
				);
			}
			$method = ($leaveInterests == 2) ? 'leave' : 'unsubscribe';
			foreach ($results as $publisherId => $streams) {
				$attributes['leftInterests'][$publisherId] = call_user_func(
					array('Streams', $method),
					$user->id, $publisherId, $streams, array('skipAccess' => true)
				);
			}
		}
		if ($leaveNearby and $oldLatitude and $oldLongitude and $oldMeters) {
			$method = ($leaveNearby == 2) ? 'leave' : 'unsubscribe';
			$attributes['leftNearby'] = call_user_func(
				array('Places_Nearby', $method),
				Users::communityId(), $oldLatitude, $oldLongitude, $oldMeters
			);
		}
	
		if ($joinInterests) {
			$results = array();
			foreach ($myInterests as $weight => $info) {
				$publisherId = $info[0];
				if (!isset($results[$publisherId])) {
					$results[$publisherId] = array();
				}
				$results[$publisherId] = array_merge(
					$results[$publisherId], Places_Interest::streams(
						$publisherId, $latitude, $longitude, $info[2], array(
							'meters' => $meters,
							'skipAccess' => true,
							'forSubscribers' => true
						)
					)
				);
			}
			$method = ($joinInterests == 1) ? 'join' : 'subscribe';
			foreach ($results as $publisherId => $streams) {
				$attributes['joinedInterests'][$publisherId] = call_user_func(
					array('Streams', $method),
					$user->id, $publisherId, $streams, array('skipAccess' => true)
				);
			}
		}
		if ($joinNearby) {
			$method = ($joinNearby == 1) ? 'join' : 'subscribe';
			$attributes['joinedNearby'] = call_user_func(
				array('Places_Nearby', $method),
				Users::communityId(),
				$latitude, $longitude, $meters
			);
		}
	}
	Q::event("Places/geolocation", $attributes, 'after');
}