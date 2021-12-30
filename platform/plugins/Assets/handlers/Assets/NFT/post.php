<?php
function Assets_NFT_post ($params) {
	$req = array_merge($_REQUEST, $params);
	$loggedInUserId = Users::loggedInUser(true)->id;
	$userId = Q::ifset($req, "userId", $loggedInUserId);

	$stream = Assets_NFT::stream($userId);
	$fields = Q::take($req, array('title', 'content', 'attributes', 'interests'));

	Assets_NFT::update($stream, $fields);
}