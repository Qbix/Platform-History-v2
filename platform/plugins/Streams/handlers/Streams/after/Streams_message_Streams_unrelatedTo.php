<?php

function Streams_after_Streams_message_Streams_unrelatedTo($params)
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
	if (isset($relatedTo[$type])) {
		foreach ($relatedTo[$type] as $weight => $info) {
			if ($info[0] === $fromPublisherId
			and $info[1] === $fromStreamName) {
				unset($relatedTo[$type][$weight]);
				break;
			}
		}
		$o = $message->getInstruction('options', null);
		$w = $message->getInstruction('weight', null);
		if (!empty($o['adjustWeights'])) {
			$rt = array();
			foreach ($relatedTo[$type] as $weight => $info) {
				if ($weight > $w) {
					$rt[$weight-1] = $info;
				} else {
					$rt[$weight] = $info;
				}
			}
			$relatedTo[$type] = $rt;
		}
	}
	$c->relatedTo = Q::json_encode($relatedTo);
	$c->save(false, true);
	// End database transaction
}