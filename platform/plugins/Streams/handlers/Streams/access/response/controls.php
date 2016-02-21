<?php

function Streams_access_response_controls()
{
	return Q::event('Streams/access/response/content', array('controls' => true));
}