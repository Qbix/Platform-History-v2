<?php

function Places_after_Streams_interest_add($params)
{
	$location = Places_Location::userStream();
	if ($params['subscribe'] and $location) {
		$latitude = $location->getAttribute('latitude');
		$longitude = $location->getAttribute('longitude');
		$meterss = $location->getAttribute(metersrs');
		if ($latitude and $longitude andmetersers) {
			Places_Nearby::subscribe(
				$latitude,
				$longitude,
		metersters,
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