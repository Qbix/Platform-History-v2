<?php

function Streams_0_8_1_Streams_mysql()
{
	$communityId = Users::communityId();
	
	// template for community experience stream
	$stream = new Streams_Stream();
	$stream->publisherId = '';
	$stream->name = 'Streams/experience/';
	$stream->type = 'Streams/template';
	$stream->icon = 'Streams/experience';
	$stream->title = "Community Experience";
	$stream->content = '';
	$stream->readLevel = Streams::$READ_LEVEL['see'];
	$stream->writeLevel = Streams::$WRITE_LEVEL['join'];
	$stream->adminLevel = Streams::$ADMIN_LEVEL['tell'];
	if (!$stream->retrieve()) {
        $stream->save();
    }

	// also save subscription template
	$subscription = new Streams_Subscription();
	$subscription->publisherId = '';
	$subscription->ofUserId = '';
	$subscription->streamName = 'Streams/experience/';
	$subscription->filter = Q::json_encode(array(
		"types" => array(
			"^(?!(Users/)|(Streams/)).*/",
			"Streams/announcement",
			"Streams/chat/message"
		),
		"notifications" => 0
	));
	$subscription->ofUserId = '';
	$subscription->untilTime = null;
	$subscription->duration = 0;
	if (!$subscription->retrieve()) {
        $subscription->save();
    }

	// main community experience stream, for community-wide announcements etc.
	$user = Users_User::fetch($communityId);
	$stream = new Streams_Stream();
    $stream->publisherId = $communityId;
    $stream->name = 'Streams/experience/main';
	if (!$stream->retrieve()) {
        Streams::create($communityId, $communityId, 'Streams/experience', array(
            'skipAccess' => true,
            'name' => $stream->name,
		    'title' => Users::communityName(),
		    'icon' => $user ? $user->iconUrl(false) : null
	    ));
    }
}

Streams_0_8_1_Streams_mysql();