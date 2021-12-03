<?php
function Streams_after_Streams_updateAvatars ($params) {
	$rows_that_show = $params["rows_that_show"];
	$rows_that_hide = $params["rows_that_hide"];

	$processed = array();
	foreach (array_merge($rows_that_show, $rows_that_hide) as $avatar) {
		if (in_array($avatar->publisherId, $processed)) {
			continue;
		}

		$stream = Streams::fetchOne($avatar->publisherId, $avatar->publisherId, "Streams/user/profile");
		$stream->title = Streams::displayName($stream->publisherId, array('asUserId' => ''));
		$stream->icon = $avatar->icon;
		$stream->save();

		$processed[] = $avatar->publisherId;
	}
}