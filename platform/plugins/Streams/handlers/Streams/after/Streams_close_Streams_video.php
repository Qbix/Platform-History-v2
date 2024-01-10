<?php
function Streams_after_Streams_close_Streams_video ($params) {
	$stream = $params['stream'];
	$provider = $stream->getAttribute("provider");
	$videoId = $stream->getAttribute("videoId");

	if ($videoId) {
		try {
			$video = new Q_Video(compact("provider"));
			$video->delete($videoId);
		} catch (Exception $e) {}
	}
}
