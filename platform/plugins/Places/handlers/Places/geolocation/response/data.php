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
		$latitude = $_REQUEST['latitude'];
		$longitude = $_REQUEST['longitude'];
	} else {
		$user = Users::loggedInUser(true);
		$stream = Places_Location::userStream();
		$latitude = $stream->getAttribute('latitude');
		$longitude = $stream->getAttribute('longitude');
		$miles = $stream->getAttribute('miles');
	}
	$miles = Q::ifset($_REQUEST, 'miles', 
		Q_Config::expect('Places', 'nearby', 'defaultMiles')
	);
	$zipcodes = Places_Zipcode::nearby(
		$latitude,
		$longitude,
		$miles,
		1
	);
	$zipcode = $zipcodes ? reset($zipcodes) : null;
	$result = array(
		'requested' => compact('latitude', 'longitude'),
		'countryCode' => $zipcode->countryCode,
		'zipcode' => $zipcode->zipcode,
		'placeName' => $zipcode->placeName,
		'stateName' => $zipcode->stateName,
		'state' => $zipcode->state,
		'regionName' => $zipcode->regionName,
		'region' => $zipcode->region,
		'latitude' => $zipcode->latitude,
		'longitude' => $zipcode->longitude
	);
	return $result;
}