<?php
function Streams_vimeo_response_info ($params=[]) {
	$request = Q::take(array_merge($_REQUEST, $params), ['videoId', 'publisherId', 'streamName']);
	$videoId = $request['videoId'];
	$publisherId = $request['publisherId'];
	$streamName = $request['streamName'];

	$vimeo = new Q_Video_Vimeo();
	$info = $vimeo->getInfo($videoId);

	if ($info['status'] == 'available' && $publisherId && $streamName) {
		$stream = Streams::fetchOne($publisherId, $publisherId, $streamName);
		$stream->setAttribute('available', true);
		$stream->changed();
	}
	return Q::take($info, array("status", "duration", "width", "height", "type"));
}