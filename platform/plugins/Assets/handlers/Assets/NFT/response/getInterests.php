<?php
function Assets_NFT_response_getInterests ($params) {
	$request = array_merge($_REQUEST, $params);
	$required = array('publisherId', 'streamName');
	Q_Valid::requireFields($required, $request, true);
	$request = Q::take($request, $required);
	$publisherId = $request["publisherId"];
	$streamName = $request["streamName"];

	return Streams::related(null, $publisherId, $streamName, false, array(
		'type' => 'NFT/interest',
		'streamsOnly' => true,
		'skipAccess' => true
	));
}