<?php
function Streams_after_Streams_create_Streams_video ($params) {
	$stream = $params['stream'];

	if (!filter_var($stream->icon, FILTER_VALIDATE_URL) || Q::startsWith($stream->icon, Q_Request::baseUrl())) {
		return;
	}

	Streams::importIcon($stream->publisherId, $stream->name, $stream->icon);
}