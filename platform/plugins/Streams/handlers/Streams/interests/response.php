<?php
	
function Streams_interests_response()
{
	// serve a javascript file and tell client to cache it
	$communityId = Q::ifset($_REQUEST, 'communityId', Users::communityId());
	$interests = Streams::interests($communityId);
	header('Content-Type: text/javascript');
	header("Pragma: cache");
	header("Cache-Control: public, max-age=60"); // cache for 1 minute
	$expires = date("D, d M Y H:i:s T", time() + 60); // cache for 1 minute
	header("Expires: $expires");
	$json = Q::json_encode($interests, true);
 	echo "Q.setObject(['Q', 'Streams', 'Interests', 'all', '$communityId'], $json);";
	return false;
}