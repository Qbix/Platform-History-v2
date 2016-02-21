<?php

function Streams_before_Users_canManageContacts($params, &$result)
{
	$asUserId = $params['asUserId'];
	$userId = $params['userId'];
	$label = $params['label'];
	$throwIfNotAuthorized = $params['throwIfNotAuthorized'];
	if ($asUserId === $userId and substr($label, 0, 6) === 'Users/') {
		$result = true;
		return;
	}
	$stream = Streams::fetchOne($asUserId, $userId, 'Streams/contacts');
	if ($stream and $stream->testWriteLevel('edit')) {
		if ($prefixes = $stream->getAttribute('prefixes', null)) {
			foreach ($prefixes as $prefix) {
				if (substr($label, 0, strlen($prefix)) === $prefix) {
					$result = true;
					return;
				}
			}
		}
	}
}