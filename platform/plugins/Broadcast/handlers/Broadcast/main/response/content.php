<?php

function Broadcast_main_response_content()
{
	Q_Response::addScript('plugins/Broadcast/js/Broadcast.js');
	
	$user = Users::loggedInUser(true);
	$stream = new Streams_Stream();
	$stream->publisherId = $user->id;
	$stream->name = 'Broadcast/main';
	if (!$stream->retrieve()) {
		$stream->type = 'Broadcast';
		$stream->title = "Main broadcast stream";
		$stream->content = "Whatever you post to this stream will be syndicated by everyone who has opted in.";
		$stream->save();
	}
	Q_Response::redirect('Broadcast/stream publisherId='.$stream->publisherId.' name=Broadcast/main');
}