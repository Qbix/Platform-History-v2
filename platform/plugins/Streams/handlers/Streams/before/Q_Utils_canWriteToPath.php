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

	$user = Users::loggedInUser();
	$userId = $user ? $user->id : "";
	$app = Q_Config::expect('Q', 'app');
	$len = strlen(APP_DIR);
	if (substr($path, 0, $len) === APP_DIR) {
		$sp = str_replace(DS, '/', substr($path, $len+1));
		if (substr($sp, -1) === '/') {
			$sp = substr($sp, 0, strlen($sp)-1);
		}
		$prefix = "files/$app/uploads/Streams/";
		$len = strlen($prefix);
		if (substr($sp, 0, $len) === $prefix) {
			$prefix2 = "files/$app/uploads/Streams/invitations/$userId/";
			if ($userId and substr($sp, 0, strlen($prefix2)) === $prefix2) {
				$result = true; // user can write any invitations here
				return;
			}
			$parts = explode('/', substr($sp, $len));
			$c = count($parts);
			if ($c >= 3) {
				$publisherId = $parts[0];
				$l = 0;
				for ($i=$c-1; $i>=1; --$i) {
					$l = $i;
					if (in_array($parts[$i], array('icon', 'file'))) {
						break;
					}
				}
				$name = implode('/', array_slice($parts, 1, $l-1));
				if ($name and $stream = Streams::fetchOne($userId, $publisherId, $name)) {
					$result = $stream->testWriteLevel('edit');
					Streams::$cache['canWriteToStream'] = $stream;
				} else {
					$result = false;
				}
			}
		}
	}
	if (!$result and $throwIfNotWritable) {
		throw new Q_Exception_CantWriteToPath();
	}
}
