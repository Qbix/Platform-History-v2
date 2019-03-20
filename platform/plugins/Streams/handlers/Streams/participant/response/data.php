<?php

function Streams_participant_response_data()
{
	return Q::event('Streams/participant/response/participants');
}