<?php
function Users_analytics_response_content($params) {
	$day = 60 * 60 * 24;
	$periods = array(
		"daily" => $day,
		"weekly" => $day * 7,
		"monthly" => date("t") * $day
	);

	$results = Users_Vote::select()->where(array(
		"forType" => array("app", "page", "Assets/service")
	))->fetchDbRows();
	$stats = array();
	foreach ($results as $result) {
		$parsed = explode("/", $result->forId);
		foreach ($periods as $period => $value) {
			if ($parsed[3] != $value) {
				continue;
			}

			if (!is_array($stats[$period])) {
				$stats[$period] = array();
			}

			$params = array("forType" => $result->forType, "userId" => $result->userId);
			if ($result->forType == "page") {
				$params["url"] = base64_decode($parsed[2]);
			} else {
				$params["name"] = $parsed[2];
			}
			$stats[$period][] = $params;
		}
	}

	$options = compact("stats", "periods");

	Q_Response::addStylesheet("{{Users}}/css/analytics.css");
	Q_Response::addScript("{{Users}}/js/pages/analytics.js");

	Q::event("Users/analytics/response", $options, "before", false, $options);

	return Q::view("Users/content/analytics.php", $options);
}