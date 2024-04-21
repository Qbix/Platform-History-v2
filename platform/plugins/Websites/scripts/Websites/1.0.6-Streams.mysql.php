<?php
function Websites_1_0_6_Streams () {
	$communityId = Users::communityId();

	// access stream for managing community roles
	$stream = new Streams_Stream();
	$stream->publisherId = $communityId;
	$stream->name = 'Streams/contacts';
	if ($stream->retrieve()) {
		$prefixes = $stream->getAttribute('prefixes', array());
		$prefixes[] = 'Websites/';
		$stream->setAttribute('prefixes', $prefixes);
		$stream->save();
	}

	// access stream for managing community roles
	$stream = new Streams_Stream();
	$stream->publisherId = $communityId;
	$stream->name = 'Streams/labels';
	if ($stream->retrieve()) {
		$prefixes = $stream->getAttribute('prefixes', array());
		$prefixes[] = 'Websites/';
		$stream->setAttribute('prefixes', $prefixes);
		$stream->save();
	}
	echo "\n";
}
Websites_1_0_6_Streams();