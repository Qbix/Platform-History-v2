<?php

function Streams_invite_put () {
	if (Q_Request::slotName('groupPhoto')) {
		$publisherId = Streams::requestedPublisherId(true);
		$streamName = Streams::requestedName(true);
		$request = Q::take($_REQUEST, array('relate', 'subpath'));
		$request["relate"]["type"] = "Streams/invite/image";

		$stream = Streams::fetchOneOrCreate($publisherId, $publisherId, $streamName, array(
			"type" => "Streams/image",
			"fields" => array(
				"title" => "Group Photo",
				"icon" => "{{baseUrl}}/Q/uploads/Streams/".$request['subpath']
			),
			"relate" => $request["relate"]
		));

		Q_Response::setSlot('groupPhoto', $stream->exportArray());
	}
}
