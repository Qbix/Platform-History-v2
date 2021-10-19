<?php
	
function Places_geolocation_response_data()
{
	$requireLogin = Q_Config::get('Places', 'geolocation', 'requireLogin', false);
	if (!$requireLogin
	and isset($_REQUEST['latitude']) 
	and isset($_REQUEST['longitude'])) {
		if (!Q_Config::get('Places', 'geolocation', 'allowClientQueries', false)) {
			throw new Q_Exception("Client queries are restricted, as per Places/geolocation/allowClientQueries");
		}
		$latitude = floatval($_REQUEST['latitude']);
		$longitude = floatval($_REQUEST['longitude']);
		$meters = null;
	} else {
		$user = Users::loggedInUser(true);
		$stream = Places_Location::userStream();
		$latitude = floatval($stream->getAttribute('latitude'));
		$longitude = floatval($stream->getAttribute('longitude'));
		$meters = floatval($stream->getAttribute('meters'));
	}
	$meters = floatval(Q::ifset($_REQUEST, 'meters', 
		isset($meters) ? $meters : Q_Config::expect('Places', 'nearby', 'defaultMeters')
	));
	$postcodes = Places_Postcode::nearby(
		$latitude,
		$longitude,
		$meters,
		1
	);
	$postcode = $postcodes ? reset($postcodes) : null;
	$result = array(
		'requested' => @compact('latitude', 'longitude'),
		'countryCode' => $postcode->countryCode,
		'postcode' => $postcode->postcode,
		'placeName' => $postcode->placeName,
		'stateName' => $postcode->stateName,
		'state' => $postcode->state,
		'regionName' => $postcode->regionName,
		'region' => $postcode->region,
		'latitude' => $postcode->latitude,
		'longitude' => $postcode->longitude
	);
	return $result;
}