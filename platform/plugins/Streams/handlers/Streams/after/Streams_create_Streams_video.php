<?php
function Streams_after_Streams_create_Streams_video ($params) {
	$stream = $params['stream'];

	if (!filter_var($stream->icon, FILTER_VALIDATE_URL) || Q::startsWith($stream->icon, Q_Request::baseUrl())) {
		return;
	}

	$icon = file_get_contents($stream->icon);

	// if icon is valid image
	if (imagecreatefromstring($icon)) {
		// upload image to stream
		Q_Image::save(array(
			'data' => $icon, // these frills, with base64 and comma, to format image data for Q/image/post handler.
			'path' => "Q/uploads/Streams",
			'subpath' => Q_Utils::splitId($stream->publisherId, 3, '/')."/".$stream->name."/icon/".time(),
			'save' => "Streams/image"
		));
	}
}