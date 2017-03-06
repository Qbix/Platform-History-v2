<?php

function Places_after_Streams_interest_remove($params)
{
	$location = Places_Location::userStream();
	if ($location) {
		$latitude = $location->getAttribute('latitude');
		$longitude = $location->getAttribute('longitude');
		$meters = $location->getAttribute('meters');
		if ($latitude and $longitude and $meters) {
			Places_Nearby::unsubscribe(
				$latitude,
				$longitude,
				$meters,
				$params['publisherId'],
				array(
					'transform' => array('Places_Interest', '_transform'),
					'title' => $params['title'],
					'skipAccess' => true
				)
			);
		}
	}
}