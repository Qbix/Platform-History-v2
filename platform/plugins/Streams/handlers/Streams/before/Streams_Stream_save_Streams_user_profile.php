<?php
function Streams_before_Streams_Stream_save_Streams_user_profile ($params, &$result) {
	$stream = $params['stream'];

	$stream->title = Streams::displayName($stream->publisherId, array('asUserId' => ''));
	$avatar = Streams_Avatar::fetch("", $stream->publisherId);
	$stream->icon = $avatar->icon;
}