<?php

function Places_after_Streams_interest_add($params)
{
	$location = Places_Location::userStream();
	if ($params['subscribe'] and $location) {
		$latitude = $location->getAttribute('latitude');
		$longitude = $location->getAttribute('longitude');
		$meters = $location->getAttribute('meters');
		if ($latitude and $longitude and $meters) {
			Places_Nearby::subscribe(
				$latitude,
				$longitude,
				$meters,
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