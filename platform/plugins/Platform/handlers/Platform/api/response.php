<?php

function Platform_api_response()
{
	$result = array();
	if ($_REQUEST['discover']) {
		$discover = $_REQUEST['discover'];
		if (is_string($discover)) {
			$discover = explode(',', $_REQUEST['discover']);
		}
		$discover = array_flip($discover);
		if (isset($discover['user'])) {
			$result['user'] = 'itzabhws';
		}
		if (isset($discover['contacts'])) {
			$result['contacts'] = array(
				'bhbsneuc' => array('labels' => array(1, 4)),
				'bgeoekat' => array('labels' => array(1, 7))
			);
		}
	}
	$json = Q::json_encode($result);
	$referer = $_SERVER['HTTP_REFERER'];
	$parts = parse_url($referer);
	$origin = Q::json_encode($parts['scheme'] . '://' . $parts['host']);
	$appUrl = Q::json_encode(Q_Request::baseUrl());
	echo <<<EOT
<!doctype html>
<html>
    <head>
        <title>Qbix Platform</title>
		<script type="text/javascript">
		window.addEventListener("message", receiveMessage, false);
		function receiveMessage(event) {
			var request = event.data;
			var response = '';
			if (!request.method) {
				response = {"error": "Missing method"};
			}
			if (request.appUrl.substr(0, event.origin.length) !== event.origin) {
				response = {"error": "Origin doesn't match"};
			} else {
				response = $json;
			}
			window.parent.postMessage(response, $origin);
		}
		var ExposedMethods = function () {
	
		};
		</script>
    </head>
    <body>
    </body>
</html>
EOT;
	return false;
}