<?php

/**
 * @module Places
 */

/**
 * Used to set the user's location from geolocation data.
 * @class HTTP Places geolocation
 * @method post
 * @param $_REQUEST
 * @param [$_REQUEST.latitude] The new latitude. If set, must also specify longitude.
 * @param [$_REQUEST.longitude] The new longitude. If set, must also specify latitude.
 * @param [$_REQUEST.zipcode] The new zip code. Can be set instead of latitude, longitude.
 * @param [$_REQUEST.meters] The distance around their location around that the user is interested in
 * @param [$_REQUEST.subscribe] Whether to subscribe to all the local interests at the new location.
 * @param [$_REQUEST.unsubscribe] Whether to unsubscribe from all the local interests at the old location.
 * @param [$_REQUEST.accuracy]
 * @param [$_REQUEST.altitude]
 * @param [$_REQUEST.altitudeAccuracy]
 * @param [$_REQUEST.heading]
 * @param [$_REQUEST.speed]
 * @param [$_REQUEST.timezone]
 * @param [$_REQUEST.placeName] optional
 * @param [$_REQUEST.state] optional
 * @param [$_REQUEST.country] optional
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
		'zipcode',
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
	if (!empty($attributes['zipcode']) and !isset($attributes['latitude'])) {
		$z = new Places_Zipcode();
		$z->countryCode = 'US';
		$z->zipcode = $attributes['zipcode'];
		if ($z->retrieve()) {
			$attributes['latitude'] = $z->latitude;
			$attributes['longitude'] = $z->longitude;
			$attributes['country'] = $z->countryCode;
		} else {
			throw new Q_Exception_MissingRow(array(
				'table' => 'zipcode',
				'criteria' => $attributes['zipcode']
			), 'zipcode');
		}
	}
	$attributes['meters'] = floatval(Q::ifset($attributes, 'meters', 
		$stream->getAttribute(
			'meters',
			Q_Config::expect('Places', 'nearby', 'defaultMeters')
		)
	));
	if (empty($attributes['zipcode']) and isset($attributes['latitude'])) {
		$zipcodes = Places_Zipcode::nearby(
			floatval($attributes['latitude']),
			floatval($attributes['longitude']),
			floatval($attributes['meters']),
			1
		);
		if ($zipcode = $zipcodes ? reset($zipcodes) : null) {
			$attributes['zipcode'] = $zipcode->zipcode;
			$attributes['placeName'] = $zipcode->placeName;
			$attributes['state'] = $zipcode->state;
			$attributes['country'] = $zipcode->countryCode;
		}
	}
	$stream->setAttribute($attributes);
	$stream->changed();
	$stream->post($user->id, array(
		'type' => 'Places/location/updated',
		'content' => '',
		'instructions' => $stream->getAllAttributes()
	), true);
	
	$shouldUnsubscribe = !empty($_REQUEST['unsubscribe']) && isset($oldMeters);
	$shouldSubscribe = !empty($_REQUEST['subscribe']);
	$noChange = false;

	$latitude = $stream->getAttribute('latitude');
	$longitude = $stream->getAttribute('longitude');
	$meters = $stream->getAttribute('meters');

	if ($shouldUnsubscribe and $shouldSubscribe
	and abs($latitude - $oldLatitude) < 0.0001
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
		$ob = new OutputBuffer();
		for ($i=0, $l=$ob->level; $i<=$l; ++$i) {
			@ob_end_flush();
		}
		flush();
		
		if ($shouldUnsubscribe or $shouldSubscribe) {
			$myInterests = Streams_Category::getRelatedTo(
				$user->id, 'Streams/user/interests', 'Streams/interests'
			);
			if (!isset($myInterests)) {
				$myInterests = array();
			}
		}

		if ($shouldUnsubscribe and $oldLatitude and $oldLongitude and $oldMeters) {
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
			foreach ($results as $publisherId => $streams) {
				Streams::unsubscribe($user->id, $publisherId, $streams, array('skipAccess' => true));
			}
			$attributes['unsubscribed'] = Places_Nearby::unsubscribe(
				$oldLatitude, $oldLongitude, $oldMeters
			);
		}
	
		if ($shouldSubscribe) {
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
			foreach ($results as $publisherId => $streams) {
				Streams::subscribe($user->id, $publisherId, $streams, array('skipAccess' => true));
			}
			$attributes['subscribed'] = Places_Nearby::subscribe(
				$latitude, $longitude, $meters
			);
		}	
	}
	Q::event("Places/geolocation", $attributes, 'after');
}