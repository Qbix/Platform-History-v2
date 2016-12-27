<?php

function Streams_after_Streams_message_Streams_relatedTo($params)
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
	if (!isset($weight)) {
		$rt = new Streams_RelatedTo();
		$rt->toPublisherId = $stream->publisherId;
		$rt->toStreamName = $stream->name;
		$rt->type = $type;
		$rt->fromPublisherId = $fromPublisherId;
		$rt->fromStreamName = $fromStreamName;
		$rt->retrieve(null, null, array('ignoreCache' => true));
		$weight = $rt->weight;
	}
	$fs = Streams::fetchOne($message->byUserId, $fromPublisherId, $fromStreamName);
	$weight = floor($weight);
	$relatedTo[$type][$weight] = array(
		$fromPublisherId, $fromStreamName, $fs->title, $fs->icon
	);
	$c->relatedTo = Q::json_encode($relatedTo);
	$c->save(false, true);
	// End database transaction
}