<?php

function Streams_subscription_response_dialog ()
{
	$streamName = explode('/', Streams::requestedName());
	Q_Response::setSlot('title', 'Subscription to ' . $streamName[1]);
	return Q::event('Streams/subscription/response/content');
}