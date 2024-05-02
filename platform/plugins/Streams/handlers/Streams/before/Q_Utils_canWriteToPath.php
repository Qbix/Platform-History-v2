<?php

function Streams_before_Q_Utils_canWriteToPath($params, &$result)
{
	extract($params);
	/**
	 * @var $path
	 * @var $throwIfNotWritable
	 * @var $mkdirIfMissing
	 */
	
	// Assume that Users/before/Q/Utils/canWriteToPath already executed
	// and it has set $result = true if it's under the user
	// or one of the authorized users is trying to manage the user's
	// icon or labels. Otherwise $result = false.
	// Now we will check things using the Streams plugin path and rules.
	// The Streams plugin may set $result = true even if it was false before.

	$user = Users::loggedInUser();
	$userId = $user ? $user->id : "";
	$app = Q::app();
	$appDir = str_replace(DS, '/', APP_DIR);
	$pluginFilesDir = str_replace(DS, '/', STREAMS_PLUGIN_FILES_DIR);
	$sp = null;
	$prefix = null;
	if (Q::startsWith($path, $appDir)) {
		$prefix = "files/$app/uploads/Streams/";
		$sp = substr($path, strlen($appDir)+1);
	} else if (Q::startsWith($path, $pluginFilesDir)) {
		$sp = substr($path, strlen($pluginFilesDir)+1);
		$prefix = "uploads/Streams/";
	}
	if (!$prefix || !Q::startsWith($sp, $prefix)) {
		return;
	}
	if (substr($sp, -1) === '/') {
		$sp = substr($sp, 0, strlen($sp)-1);
	}
	$splitId = Q_Utils::splitId($userId, 3, '/');
	$prefix2 = $prefix."invitations/$splitId";
	if ($userId and Q::startsWith($sp, $prefix2)) {
		$result = true; // user can write any invitations here
		return;
	}

	$parts = explode('/', substr($sp, strlen($prefix)));	
	$c = count($parts);
	if ($c >= 3) {
		$result = false;
		for ($j=0; $j<$c-3; ++$j) {
			$publisherId = implode('', array_slice($parts, 0, $j+1));
			if (!Users_User::fetch($publisherId)) {
				continue;
			}
			$l = $j;
			for ($i=$c-1; $i>$j; --$i) {
				$l = $i;
				if (in_array($parts[$i], array('icon', 'file', 'video', 'audio'))) {
					break;
				}
			}
			$streamName = implode('/', array_slice($parts, $j+1, $l-$j-1));
			if ($streamName && $stream = Streams_Stream::fetch($userId, $publisherId, $streamName)) {
				$result = $stream->testWriteLevel('edit');
				Streams::$cache['canWriteToStream'] = $stream;
				break;
			}
		}
	}
}