<?php
function Streams_before_Streams_save_Streams_video ($params) {
	$stream = $params['stream'];
	$modifiedFields = $params['modifiedFields'];
	$attributes = Q::ifset($modifiedFields, 'attributes', null);

	if (empty($attributes)) {
		return;
	}

	$attributes = Q::json_decode($attributes, true);
	if ($stream->getAttribute('Q.file.url') != $attributes['Q.file.url'] || $stream->getAttribute('Streams.videoUrl') != $attributes['Streams.videoUrl']) {
		$provider = $stream->getAttribute("provider");
		$videoId = $stream->getAttribute("videoId");
		if ($provider == "vimeo" && $videoId) {
			$newVideoId = Q::ifset($attributes, 'videoId', null);
			if ($newVideoId && $videoId == $newVideoId) {
				unset($attributes['videoId']);
			}
			$modifiedFields['attributes'] = Q::json_encode($attributes);
			try {
				$video = new Q_Video_Vimeo();
				$video->doDelete($videoId);
			} catch (Exception $e) {}
		}
	}

}