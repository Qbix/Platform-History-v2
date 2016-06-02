<?php

function Places_after_Streams_interest_remove($params)
{
	$location = Places_Location::userStream();
	if ($location) {
		$latitude = $location->getAttribute('latitude');
		$longitude = $location->getAttribute('longitude');
		$miles = $location->getAttribute('miles');
		if ($latitude and $longitude and $miles) {
			Places_Nearby::unsubscribe(
				$latitude,
				$longitude,
				$miles,
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