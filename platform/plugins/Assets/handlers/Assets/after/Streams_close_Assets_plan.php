<?php

function Assets_after_Streams_close_Assets_plan ($params) {
	$stream = $params['stream'];

	Users_Label::removeLabel($stream->name, $stream->publisherId, null, true);
	Users_Contact::delete()->where(array(
		"userId" => $stream->publisherId,
		"label" => $stream->name
	))->execute();
}