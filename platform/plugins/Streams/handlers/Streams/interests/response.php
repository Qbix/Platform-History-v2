<?php
	
function Streams_interests_response()
{
	// serve a javascript file and tell client to cache it
	$communityId = Q::ifset($_REQUEST, 'communityId', Users::communityId());
	$interests = Streams::interests($communityId);
	header('Content-Type: text/javascript');
	header("Pragma: ", true); // 1 day
	header("Cache-Control: public, max-age=86400"); // 1 day
	$expires = date("D, d M Y H:i:s T", time() + 86400);
	header("Expires: $expires"); // 1 day
	$json = Q::json_encode($interests, true);
 	echo "Q.setObject(['Q', 'Streams', 'Interests', 'all', '$communityId'], $json);";
	return false;
}