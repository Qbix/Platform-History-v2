<?php
	
function Streams_after_Streams_Stream_save_Streams_greeting($params)
{
	$s = $params['stream'];
	$parts = explode('/', $s->name, 3);
	if (count($parts) < 3) {
		throw new Q_Exception_WrongValue(array(
			'field' => 'stream name',
			'range' => 'Streams/greeting/$communityId'
		));
	}
	$communityId = $parts[2];
	$p = new Streams_Participant();
	$p->publisherId = $communityId;
	$p->streamName = "Streams/experience/main";
	$p->userId = $s->publisherId;
	if ($p->retrieve()) {
		$p->setExtra('Streams/greeting', substr($s->content, 0, 500));
		$p->save();
	}
}