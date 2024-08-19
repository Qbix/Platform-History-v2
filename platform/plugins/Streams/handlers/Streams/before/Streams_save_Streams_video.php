<?php
function Streams_before_Streams_save_Streams_video ($params) {
	$stream = $params['stream'];
	$modifiedAttributes = Q::ifset($params, 'modifiedFields', 'attributes', null);
	$originalAttributes = Q::ifset($stream, 'fieldsOriginal', 'attributes', null);

	if (empty($originalAttributes) || empty($modifiedAttributes)) {
		return;
	}

	$originalAttributes = Q::json_decode($originalAttributes, true);
	$modifiedAttributes = Q::json_decode($modifiedAttributes, true);
	if ($originalAttributes['Q.file.url'] != $modifiedAttributes['Q.file.url'] || $originalAttributes['Streams.videoUrl'] != $modifiedAttributes['Streams.videoUrl']) {
		$provider = $originalAttributes["provider"];
		$videoId = $originalAttributes["videoId"];
		if ($provider == "vimeo" && $videoId) {
			$newVideoId = Q::ifset($modifiedAttributes, 'videoId', null);
			if ($newVideoId && $videoId == $newVideoId) {
				unset($modifiedAttributes['videoId']);
			}
			try {
				$video = new Q_Video_Vimeo();
				$video->doDelete($videoId);
			} catch (Exception $e) {}
		}
	}

}