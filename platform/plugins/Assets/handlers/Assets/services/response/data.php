<?php
function Assets_services_response_data($params) {
	$servicePublisherId = Q::ifset($_REQUEST, 'publisherId', null);
	$serviceStreamName = Q::ifset($_REQUEST, 'streamName', null);

	// get available slots from service stream
	$serviceStream = Streams_Stream::fetch(null, $servicePublisherId, $serviceStreamName, true);

	$_relatedServices = Streams_RelatedTo::select()->where(array(
		'toPublisherId' => $serviceStream->publisherId,
		'toStreamName' => $serviceStream->name,
		'type' => 'Calendars/availability'
	))->fetchDbRows();
	$relatedServices = array();
	foreach ($_relatedServices as $item) {
		$relatedServices[] = array(
			'publisherId' => $item->fromPublisherId,
			'streamName' => $item->fromStreamName
		);
	}

	return @compact("relatedServices");
}
