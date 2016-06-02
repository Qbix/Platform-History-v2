<?php

function Places_after_Streams_interest_add($params)
{
	$location = Places_Location::userStream();
	if ($params['subscribe'] and $location) {
		$latitude = $location->getAttribute('latitude');
		$longitude = $location->getAttribute('longitude');
		$miles = $location->getAttribute('miles');
		if ($latitude and $longitude and $miles) {
			Places_Nearby::subscribe(
				$latitude,
				$longitude,
				$miles,
				$params['publisherId'],
				array(
					'transform' => array('Places_Interest', '_transform'),
					'create' => array('Places_Interest', '_create'),
					'title' => $params['title'],
					'skipAccess' => true
				)
			);
		}
	}
}