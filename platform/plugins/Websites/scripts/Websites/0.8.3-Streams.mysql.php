<?php

function Websites_0_8_3_Streams_mysql()
{
	$app = Q::app();
	$communityId = Users::communityId();
	
	// access for managing community experiences
	$access = new Streams_Access();
	$access->publisherId = $communityId;
	$access->streamName = 'Streams/experience*';
	$access->ofUserId = '';
	$access->ofContactLabel = "Websites/admins";
	$access->readLevel = Streams::$READ_LEVEL['messages'];
	$access->writeLevel = Streams::$WRITE_LEVEL['edit'];
	$access->adminLevel = Streams::$ADMIN_LEVEL['manage'];
	$access->save();
}

Websites_0_8_3_Streams_mysql();