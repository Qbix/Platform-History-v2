<?php

function Streams_vimeo_post ($params) {
	Q_Request::requireValidNonce();
	$loggedInUser = Users::loggedInUser(true);

	$request = array_merge($_REQUEST, $params);

	// create uploading intent on vimeo server
	if (Q_Request::slotName('intent')) {
		$video = new Q_Video_Vimeo();
		$intent = $video->doCreate($request);
		Q_Response::setSlot('intent', $intent['body']);
	}
}