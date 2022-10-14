<?php

function Streams_access_response_extra($options)
{
	$options['controls'] = true;
	return Q::event('Streams/access/response/content', $options);
}