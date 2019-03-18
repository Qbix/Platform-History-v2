<?php

function Streams_stream_response_Q_inplace()
{
	$stream = isset(Streams::$cache['stream']) ? Streams::$cache['stream'] : null;
	if (!$stream) {
		throw new Exception("No stream");
	}
	if (isset($_REQUEST['title'])) {
		$result = $stream->title;
	} else if (isset($_REQUEST['attributes'])) {
		if (is_array($_REQUEST['attributes'])) {
			reset($_REQUEST['attributes']);
			$result = $stream->getAttribute(key($_REQUEST['attributes']));
		} else {
			$result = $stream->attributes;
		}
	} else {
		$fieldNames = array_diff(
			Streams::getExtendFieldNames($stream->type),
			array('insertedTime', 'updatedTime')
		);
		$field = 'content';
		foreach ($fieldNames as $f) {
			if (isset($_REQUEST[$f])) {
				$field = $f;
				break;
			}
		}
		$result = $stream->$field;
	}
	$convert = Q::ifset($_REQUEST, 'convert', '["\n"]');
	return Q_Html::text($result, json_decode($convert, true));
}