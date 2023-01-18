<?php
function Streams_after_Streams_updateAvatars ($params) {
	$rows_that_show = Q::ifset($params, 'rows_that_show', array());
	$rows_that_hide = Q::ifset($params, 'rows_that_hide', array());

	$processed = array();
	foreach (array_merge($rows_that_show, $rows_that_hide) as $avatar) {
		if (in_array($avatar->publisherId, $processed)) {
			continue;
		}

		$stream = Streams_Stream::fetch($avatar->publisherId, $avatar->publisherId, "Streams/user/profile");
		$stream->title = Streams::displayName($stream->publisherId, array('asUserId' => ''));
		$stream->icon = $avatar->icon;
		$stream->save();

		$processed[] = $avatar->publisherId;
	}
}