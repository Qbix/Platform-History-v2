<?php
function Users_analytics_response_content($params) {
	$day = 60 * 60 * 24;
	$periods = array(
		"daily" => $day,
		"weekly" => $day * 7,
		"monthly" => date("t") * $day
	);
	$types = array("app", "page", "Assets/service", "faq");
	$results = Users_Vote::select()->where(array(
		"forType" => $types
	))->fetchDbRows();
	$stats = array();
	$weekDaysStat = array();
	foreach ($types as $type) {
		$weekDaysStat[$type] = array(
			"Mon" => 0,
			"Tue" => 0,
			"Wed" => 0,
			"Thu" => 0,
			"Fri" => 0,
			"Sat" => 0,
			"Sun" => 0
		);
	}

	foreach ($results as $result) {
		$parsed = explode("/", $result->forId);
		foreach ($periods as $period => $value) {
			if ($parsed[3] != $value) {
				continue;
			}

			// collect stats per week day
			if ($value == $day) {
				$weekDaysStat[$result->forType][date("D", $parsed[4])]++;
			}

			if (!is_array($stats[$period])) {
				$stats[$period] = array();
			}

			$params = array("forType" => $result->forType, "userId" => $result->userId);
			if ($result->forType == "page") {
				$params["name"] = base64_decode($parsed[2]);
			} else {
				$params["name"] = $parsed[2];
			}
			$stats[$period][] = $params;
		}
	}

	$options = compact("stats", "periods", "weekDaysStat");

	Q_Response::addStylesheet("{{Users}}/css/analytics.css");
	Q_Response::addScript("{{Users}}/js/pages/analytics.js");

	Q::event("Users/analytics/response", $options, "before", false, $options);

	return Q::view("Users/content/analytics.php", $options);
}