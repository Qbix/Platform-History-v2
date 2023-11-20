<?php
function Streams_metrics_response_metrics ($options) {
	$loggedInUserId = Users::loggedInUser(true)->id;
	$request = array_merge($_REQUEST, $options);
	Q_Request::requireFields(["publisherId", "streamName"], $request, true, true);

	// is admin
	$isAdmin = (bool)Users::roles(null, Q_Config::expect('Streams', 'canManage'));

	$where = [
		"publisherId" => $request["publisherId"],
		"streamName" => $request["streamName"]
	];
	if (!$isAdmin) {
		$where["userId"] = $loggedInUserId;
	}
	$result = Streams_Metrics::select()->where($where)->orderBy('updatedTime', false)->fetchDbRows();

	return $result;
}