<?php

function Websites_1_0_1_Streams_mysql()
{
	$stream = new Streams_Stream();
	$stream->publisherId = Users::communityId();
	$stream->name = 'Websites/webpage/';
	$stream->type = 'Streams/template';
	$stream->readLevel = Streams::$READ_LEVEL['max'];
	$stream->writeLevel = Streams::$WRITE_LEVEL['relate'];
	$stream->adminLevel = Streams::$ADMIN_LEVEL['max'];
	$stream->save(true);
}

Websites_1_0_1_Streams_mysql();