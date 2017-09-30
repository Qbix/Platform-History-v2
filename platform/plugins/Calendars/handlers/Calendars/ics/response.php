<?php

function Calendars_ics_response ()
{
	$eventId = Q_Dispatcher::uri()->eventId;
	$publisherId = Q_Dispatcher::uri()->publisherId;
	$streamName = "Calendars/event/$eventId";
	$stream = Streams::fetchOne(null, $publisherId, $streamName);
	if (!$stream) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'stream',
			'criteria' => "$publisherId: $streamName"
		));
	}
	// TODO: add a route
	$url = Q_Request::baseUrl("event/$publisherId/$eventId");
	$title = $stream->title;
	$location = $stream->getAttribute('address', '');
	$startTime = $stream->getAttribute('startTime', '');
	$start = $startTime ? date('Ymd\THis', $startTime) : '';
	$endTime = $stream->getAttribute('endTime', '');
	$end = $endTime ? date('Ymd\THis', $endTime) : '';
	if (!$end) {
		$duration = Calendars_Event::defaultDuration();
		$end = $startTime ? date('Ymd\THis', $startTime + $duration) : '';
	}
	$ics = <<<ICS
BEGIN:VCALENDAR
VERSION:2.0
PRODID:{$publisherId}_{$eventId}
BEGIN:VEVENT
UID:{$publisherId}_{$eventId}
DTSTAMP:$start
DTSTART:$start
URL:$url
SUMMARY:$title
LOCATION:$location
BEGIN:VALARM
TRIGGER:-PT30M
ACTION:DISPLAY
DESCRIPTION:$title
END:VALARM
END:VEVENT
END:VCALENDAR
ICS;
	header("Content-Type:text/calendar;");
	echo $ics;
	return false;
}