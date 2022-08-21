<?php

/**
 * Front controller for Q
 */
include(dirname(__FILE__).DIRECTORY_SEPARATOR.'Q.inc.php');

//
// Handle batch request
//

$urls = Q::ifset($_REQUEST['urls'], array());

Q::log("Batch request for ".count($urls)." urls");

header("Content-type: application/json");
Q_Response::$batch = true;
echo "[";

$original_request = $_REQUEST;
foreach ($urls as $i => $url) {
	$request = parse_url($url);
	parse_str($request['query'], $_REQUEST);
	$request = explode('?', $url);
	echo "[";
	if (!empty($request[0])) Q_ActionController::execute($request[0]);
	echo "]";
	if (isset($urls[$i+1])) echo ',';
}

$_REQUEST = $original_request;
echo "]";
Q::log("~" . ceil(Q::milliseconds()) . 'ms+'.ceil(memory_get_peak_usage()/1000).'kb.'." batch complete.");
