<?php

function Places_after_Streams_interest_remove($params)
{
	$location = Places_Location::userStream();
	if ($location) {
		Places_Nearby::unsubscribe(
			$location->getAttribute('latitude'),
			$location->getAttribute('longitude'),
			$location->getAttribute('miles'),
			$params['publisherId'],
			array(
				'transform' => array('Places_Interest', '_transform'),
				'title' => $params['title'],
				'skipAccess' => true
			)
		);
	}
}