<?php
	
function Streams_1_1_9_Users()
{
	$communityId = Users::communityId();

	// access stream for managing community roles
	$stream = new Streams_Stream();
	$stream->publisherId = $communityId;
	$stream->name = 'Streams/labels';
	if ($stream->retrieve()) {
		$prefixes = $stream->getAttribute('prefixes', array());
		$prefixes[] = '<<< web3_';
		$stream->setAttribute('prefixes', $prefixes);
		$stream->save();
	}
	echo "\n";
}
Streams_1_1_9_Users();