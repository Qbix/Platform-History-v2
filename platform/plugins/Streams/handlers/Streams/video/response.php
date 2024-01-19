<?php
/**
 * Video proxy
 * Get data from video url and pass to client in one's own name
 * @method Streams_video_response
 * @static
 * @param {string} $params['url'] Video url
 */
function Streams_video_response ($params=[]) {
	Q_Request::requireValidNonce();
	Users::loggedInUser(true);
	$request = array_merge($_REQUEST, $params);

	ini_set('memory_limit','1024M');
	set_time_limit(3600);
	ob_start();

	// do any user checks here - authentication / ip restriction / max downloads / whatever**
	// if check fails, return back error message**
	// if check succeeds, proceed with code below**

	if(isset($_SERVER['HTTP_RANGE'])) {
		$opts['http']['header'] = "Range: ".$_SERVER['HTTP_RANGE'];
	}
	$opts['http']['method'] = "HEAD";
	$conh = stream_context_create($opts);
	$opts['http']['method'] = "GET";
	$cong = stream_context_create($opts);
	$out[] = file_get_contents($request['url'],false, $conh);
	$out[] = $http_response_header;

	ob_end_clean();

	array_map("header", $http_response_header);

	readfile($request['url'],false, $cong);
}