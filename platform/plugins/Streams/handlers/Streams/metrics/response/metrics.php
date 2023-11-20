<?php
function Streams_metrics_response_metrics ($options) {
	$request = array_merge($_REQUEST, $options);
	Q_Request::requireFields(["publisherId", "streamName"], $request, true, true);

	$result = Streams_Metrics::select()->where([
		"publisherId" => $request["publisherId"],
		"streamName" => $request["streamName"]
	])->orderBy('updatedTime', false)->fetchDbRows();

	return $result;
}