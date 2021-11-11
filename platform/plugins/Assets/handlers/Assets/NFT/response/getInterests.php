<?php
function Assets_NFT_response_getInterests ($params) {
	$request = array_merge($_REQUEST, $params);
	$required = array('publisherId', 'streamName');
	Q_Valid::requireFields($required, $request, true);
	$request = Q::take($request, $required);
	$publisherId = $request["publisherId"];
	$streamName = $request["streamName"];

	$relatedStreams = Streams_RelatedTo::select('sr.*, ss.*', 'sr')->where(array(
		"sr.fromPublisherId" => $publisherId,
		"sr.fromStreamName" => $streamName,
		"sr.type" => "NFT/interest"
	))->join(Streams_Stream::table() . ' ss', array(
		'sr.toPublisherId' => 'ss.publisherId',
		'sr.toStreamName' => 'ss.name'
	), 'LEFT')->fetchDbRows();

	return $relatedStreams;
}