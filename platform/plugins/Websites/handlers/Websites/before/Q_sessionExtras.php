<?php

function Websites_before_Q_sessionExtras()
{
	$user = Users::loggedInUser(false, false);
	$userId = $user ? $user->id : "";
	$websitesUserId = Users::communityId();
	$sha1 = sha1(Q_Dispatcher::uri());
	$seoStreamName = "Websites/seo/$sha1";
	$stream = Streams::fetchOne($userId, $websitesUserId, $seoStreamName);
	if ($stream) {
		$fields = Q::take(
			$stream->getAllAttributes(),
			array('keywords', 'description')
		);
		foreach ($fields as $k => $v) {
			Q_Response::setMeta($k, $v);
		}
		Q_Response::setSlot('title', $stream->getAttribute('title'));
	}
}
