<?php

function Places_autocomplete_response_results()
{
	$r = Q::take($_REQUEST, array(
		'input' => '', 
		'types' => null, 
		'latitude' => null, 
		'longitude' => null,
		'meters' => 25
	));
	return Places::autocomplete(
		$r['input'], 
		true,
		$r['types'], 
		$r['latitude'], 
		$r['longitude'],
		$r['meters']
	);
}

