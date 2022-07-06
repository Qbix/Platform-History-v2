<?php

function Assets_0_3()
{
	$app = Q::app();
	$streamName = "Assets/plans";

	// if stream already exist - exit
	if (Streams_Stream::fetch($app, $app, $streamName)) {
		return;
	}

	Streams::create($app, $app, 'Streams/category', 
		array('name' => $streamName, 'title' => 'Subscription Plans')
	);
}

Assets_0_3();