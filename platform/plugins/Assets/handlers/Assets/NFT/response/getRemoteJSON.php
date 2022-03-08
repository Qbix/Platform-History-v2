<?php
function Assets_NFT_response_getRemoteJSON ($params) {
	Q_Valid::nonce(true);

	$request = array_merge($_REQUEST, $params);
	$required = array('url');
	Q_Valid::requireFields($required, $request, true);

	$content = file_get_contents($request["url"]);
	if (!$content) {
		throw new Exception("url return empty content");
	}

	return Q::json_decode($content, true);
}