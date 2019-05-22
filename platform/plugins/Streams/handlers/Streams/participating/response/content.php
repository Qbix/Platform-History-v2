<?php

function Streams_participating_response_content()
{
	$loggedUserId = Users::loggedInUser(true)->id;
	//$participants = Streams::participating(null, array('streamsOnly' => true));
	$participants = Db::connect('Streams')->rawQuery("select srt.*, sp.state, sp.subscribed from 
	streams_related_to srt, streams_participant sp 
	where srt.toPublisherId='".$loggedUserId."' and srt.toStreamname='Streams/participating'
	and sp.publisherId=srt.fromPublisherId and sp.streamName=srt.fromStreamName and sp.userId='".$loggedUserId."'")->fetchDbRows();

	Q_Response::addStylesheet("{{Streams}}/css/pages/participants.css");
	Q_Response::addScript("{{Streams}}/js/pages/participants.js");

	return Q::view("Streams/content/participating.php", compact('participants', 'loggedUserId'));
}
