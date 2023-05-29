<?php

function Streams_before_Q_Utils_canReadFromPath($params, &$result)
{
	extract($params);
	/**
	 * @var $path
	 */
	
	// Assume that Users/before/Q/Utils/canReadFromPath already executed

	$user = Users::loggedInUser();
	$userId = $user ? $user->id : "";
	$app = Q::app();
	$len = strlen(APP_DIR);
	if (substr($path, 0, $len) === APP_DIR) {
		$sp = str_replace(DS, '/', substr($path, $len+1));
		if (substr($sp, -1) === '/') {
			$sp = substr($sp, 0, strlen($sp)-1);
		}
		$prefix = "files/$app/uploads/Streams/";
		$len = strlen($prefix);

		if (substr($sp, 0, $len) === $prefix) {
			$splitId = Q_Utils::splitId($userId, 3, '/');
			$prefix2 = $prefix."invitations/$splitId";
			if ($userId and substr($sp, 0, strlen($prefix2)) === $prefix2) {
				$result = true; // user can read any invitations here
				return;
			}

			$parts = explode('/', substr($sp, $len));	
			$c = count($parts);
			if ($c >= 3) {
				$result = false;
				for ($j=0; $j<$c-3; ++$j) {
					$publisherId = implode('', array_slice($parts, 0, $j+1));
					$l = $j;
					for ($i=$c-1; $i>$j; --$i) {
						$l = $i;
						if (in_array($parts[$i], array('icon', 'file', 'video', 'audio'))) {
							break;
						}
					}
                    $streamName = implode('/', array_slice($parts, $j+1, $l-$j-1));
					if ($streamName && $stream = Streams_Stream::fetch($userId, $publisherId, $streamName)) {
						$result = $stream->testReadLevel('content');
						Streams::$cache['canReadFromStream'] = $stream;
						break;
					}
				}
			}
		}
	}
}
