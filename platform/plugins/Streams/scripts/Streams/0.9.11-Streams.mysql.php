<?php

function Streams_0_9_11_Streams()
{
	$publisherId = Q::app();
	Streams::create($publisherId, $publisherId, 'Streams/tasks', array(
		'name' => 'Streams/import/app',
		'readLevel' => 0,
		'writeLevel' => 0,
		'adminLevel' => 0
	));
}

Streams_0_9_11_Streams();