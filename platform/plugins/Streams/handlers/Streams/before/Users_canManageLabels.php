<?php

function Streams_before_Users_canManageLabels($params, &$result)
{
	$asUserId = $params['asUserId'];
	$userId = $params['userId'];
	$label = $params['label'];
	$readOnly = $params['readOnly'];
	$throwIfNotAuthorized = $params['throwIfNotAuthorized'];
	if ($asUserId === $userId) {
		if ($readOnly or substr($label, 0, 6) === 'Users/') {
			$result = true;
			return;
		}
	}
	$stream = Streams_Stream::fetch($asUserId, $userId, 'Streams/labels');
	if (!$stream or !$stream->testReadLevel('content')) {
		return;
	}
	if ($readOnly) {
		$result = true;
		return;
	}
	if ($label and $stream->testWriteLevel('edit')) {
		$prefixes = $stream->getAttribute('prefixes', null);
		if (!isset($prefixes)) {
			$result = true;
			return;
		}
		foreach ($prefixes as $prefix) {
			if (Q::startsWith($label, $prefix)) {
				$result = true;
				return;
			}
		}
	}
}