<?php

function Streams_access_response_control($options)
{
	$options['controls'] = true;
	//return Q::event('Streams/access/response/content', $options);
	return Q::tool('Streams/access', $options, array('tag' => false));
	
}