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
			try {
				$video = new Q_Video_Vimeo();
				$video->doDelete($videoId);
			} catch (Exception $e) {}
		}
		$modifiedAttributes['available'] = false;
		$params['modifiedFields']['attributes'] = Q::json_encode($modifiedAttributes);
	}
}