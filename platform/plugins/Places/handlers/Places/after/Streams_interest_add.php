<?php

function Places_after_Streams_interest_add($params)
{
	$location = Places_Location::userStream();
	if ($params['subscribe'] and $location
	and $location->getAttribute('latitude')
	and $location->getAttribute('longitude')
	and $location->getAttribute('miles')) {
		Places_Nearby::subscribe(
			$location->getAttribute('latitude'),
			$location->getAttribute('longitude'),
			$location->getAttribute('miles'),
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