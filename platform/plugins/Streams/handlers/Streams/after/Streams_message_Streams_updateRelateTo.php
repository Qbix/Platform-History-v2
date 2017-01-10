<?php

function Streams_after_Streams_message_Streams_updateRelateTo($params)
{
	$message = $params['message'];
	$type = $message->getInstruction('type', null);
	$stream = $params['stream'];
	$rtypes = Q_Config::get(
		'Streams', 'categorize', 'relationTypes', array()
	);
	$stypes = Q_Config::get(
		'Streams', 'categorize', 'streamTypes', array()
	);
	if (!in_array($type, $rtypes)
	or !in_array($stream->type, $stypes)) {
		return;
	}

	$c = new Streams_Category();
	$c->publisherId = $stream->publisherId;
	$c->streamName = $stream->name;
	
	$fromPublisherId = $message->getInstruction('fromPublisherId', null);
	$fromStreamName = $message->getInstruction('fromStreamName', null);
	if (!isset($fromPublisherId) or !isset($fromStreamName)) {
		return;
	}
	
	// Begin database transaction
	$relatedTo = $c->retrieve(null, array('begin' => true))
		? json_decode($c->relatedTo, true)
		: array();
	$weight = (double)$message->getInstruction('weight', null);
	$previousWeight = (double)$message->getInstruction('previousWeight', null);
	$adjustWeightsBy = $message->getInstruction('adjustWeightsBy', null);
	if (isset($relatedTo[$type])) {
		$prev = $relatedTo[$type][$previousWeight];
		$rt = array();
		foreach ($relatedTo[$type] as $w => $info) {
			if ($weight < $previousWeight
			and ($w < $weight or $previousWeight <= $w)) {
				$rt[$w] = $info;
			} else if ($weight >= $previousWeight
			and ($w <= $previousWeight or $weight < $w)) {
				$rt[$w] = $info;
			} else {
				$rt[$w+$adjustWeightsBy] = $info;
			}
		}
		$rt[$weight] = $prev;
		$relatedTo[$type] = $rt;
	}
	$c->relatedTo = Q::json_encode($relatedTo);
	$c->save(false, true);
	// End database transaction
}