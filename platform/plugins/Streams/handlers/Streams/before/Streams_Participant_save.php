<?php
	
function Streams_before_Streams_Participant_save($params)
{
	$row = $params['row'];
	if (substr($row->streamName, 0, 18) === 'Streams/community/'
	and !$row->wasRetrieved()) {
		$communityId = $row->publisherId;
		$stream = new Streams_Stream();
		$stream->publisherId = $row->userId;
		$stream->name = "Streams/greeting/$communityId";
		if ($stream->retrieve()) {
			$row->setExtra('Streams/greeting', $stream->content);
		}
	}
}