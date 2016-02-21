<?php

/**
 * Used to set the user's location from geolocation data.
 * @param $_REQUEST
 * @param [$_REQUEST.latitude] The new latitude. If set, must also specify longitude.
 * @param [$_REQUEST.longitude] The new longitude. If set, must also specify latitude.
 * @param [$_REQUEST.zipcode] The new zip code. Can be set instead of latitude, longitude.
 * @param [$_REQUEST.miles] The distance around their location around that the user is interested in
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
	$oldMiles = $stream->getAttribute('miles');
	$fields = array(
		'accuracy',
		'altitude',
		'altitudeAccuracy',
		'heading',
		'latitude',
		'longitude',
		'speed',
		'miles',
		'zipcode',
		'timezone',
		'placeName',
		'state',
		'country'
	);
	$attributes = Q::take($_REQUEST, $fields);
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
	$attributes['miles'] = Q::ifset($attributes, 'miles', 
		$stream->getAttribute(
			'miles',
			Q_Config::expect('Places', 'nearby', 'defaultMiles')
		)
	);
	if (empty($attributes['zipcode']) and isset($attributes['latitude'])) {
		$zipcodes = Places_Zipcode::nearby(
			$attributes['latitude'],
			$attributes['longitude'],
			$attributes['miles'],
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
	$stream->save();
	$stream->post($user->id, array(
		'type' => 'Places/location/updated',
		'content' => '',
		'instructions' => $stream->getAllAttributes()
	), true);
	
	$shouldUnsubscribe = !empty($_REQUEST['unsubscribe']) && isset($oldMiles);
	$shouldSubscribe = !empty($_REQUEST['subscribe']);
	$noChange = false;

	$latitude = $stream->getAttribute('latitude');
	$longitude = $stream->getAttribute('longitude');
	$miles = $stream->getAttribute('miles');

	if ($shouldUnsubscribe and $shouldSubscribe
	and abs($latitude - $oldLatitude) < 0.0001
	and abs($longitude - $oldLongitude) < 0.0001
	and abs($miles - $oldMiles) < 0.001) {
		$noChange = true;
	}

	if (!$noChange) {
		if ($shouldUnsubscribe or $shouldSubscribe) {
			$myInterests = Streams_Category::getRelatedTo(
				$user->id, 'Streams/user/interests', 'Streams/interest'
			);
			if (!isset($myInterests)) {
				$myInterests = array();
			}
		}
	
		if ($shouldUnsubscribe) {
			// TODO: implement mass unsubscribe
			foreach ($myInterests as $weight => $info) {
				Places_Nearby::unsubscribe(
					$oldLatitude,
					$oldLongitude,
					$oldMiles,
					$info[0],
					array(
						'transform' => array('Places_Interest', '_transform'),
						'title' => $info[2],
						'skipAccess' => true
					)
				);
			}
			$attributes['unsubscribed'] = Places_Nearby::unsubscribe(
				$oldLatitude, $oldLongitude, $oldMiles
			);
		}
	
		if ($shouldSubscribe) {
			// TODO: implement mass subscribe
			foreach ($myInterests as $weight => $info) {
				Places_Nearby::subscribe(
					$latitude,
					$longitude,
					$miles,
					$info[0],
					array(
						'transform' => array('Places_Interest', '_transform'),
						'create' => array('Places_Interest', '_create'),
						'title' => $info[2],
						'skipAccess' => true
					)
				);
			}
			$attributes['subscribed'] = Places_Nearby::subscribe(
				$latitude, $longitude, $miles
			);
		}	
	}
	
	$attributes['stream'] = $stream;
	
	Q_Response::setSlot('attributes', $attributes);
	Q::event("Places/geolocation", $attributes, 'after');
}