<?php

function Websites_0_8_4_Streams_mysql()
{
	$app = Q::app();
	$communityId = Users::communityId();
	
	// allow inserting images in articles
	$r = new Streams_RelatedTo();
	$r->toPublisherId = '';
	$r->toStreamName = 'Websites/article/';
	$r->type = 'Streams/images';
	$r->fromPublisherId = $communityId;
	$r->fromStreamName = 'Streams/image/';
	$r->save();
}

Websites_0_8_4_Streams_mysql();