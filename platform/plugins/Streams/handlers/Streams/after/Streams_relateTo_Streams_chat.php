<?php

function Streams_after_Streams_relateTo_Streams_chat($params)
{
	$chatStream = $params['category'];
	$relatedStream = $params['stream'];

	if ($relatedStream->type == 'Media/webrtc') {
		$displayName = Users::fetch($relatedStream->publisherId)->displayName();
		$chatStream->post($relatedStream->publisherId, array(
			'type' => 'Streams/call',
			'content' => '.',
			'instructions' => array(
				'displayName' => $displayName
			)
		), true);
	}
}