<?php
function Streams_after_Streams_close_Streams_video ($params) {
	$stream = $params['stream'];
	$provider = $stream->getAttribute("provider");
	$videoId = $stream->getAttribute("videoId");

	if ($provider == "vimeo" && $videoId) {
		try {
			$video = new Q_Video_Vimeo();
			$video->doDelete($videoId);
		} catch (Exception $e) {}
	}
}
