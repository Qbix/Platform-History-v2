<?php

function Assets_after_Streams_create_Assets_plan ($params) {
	$stream = $params['stream'];

	Users_Label::addLabel($stream->name, $stream->publisherId, $stream->title, $stream->icon);
}