<?php

function Websites_0_8_3_Streams_mysql()
{
	$app = Q::app();
	$communityId = Users::communityId();
	
	// access for managing community experiences
	Streams::saveMutable(
		'Streams/experience', '', null, array('messages', 'edit', 'manage')
	);
}

Websites_0_8_3_Streams_mysql();