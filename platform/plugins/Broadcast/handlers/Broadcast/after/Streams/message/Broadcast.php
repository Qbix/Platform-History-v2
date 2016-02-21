<?php

function Broadcast_after_Streams_message_Broadcast($params)
{
	extract($params);

	$m = new Broadcast_Message();
	$m->publisherId = $message->publisherId;
	$m->streamName = $message->streamName;
	$m->ordinal = $message->ordinal;
	$m->instructions = $message->broadcast_instructions;
	$m->save();
}
