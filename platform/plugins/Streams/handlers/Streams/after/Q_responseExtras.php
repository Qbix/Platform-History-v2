<?php

function Streams_after_Q_responseExtras() {
	if ($preloaded = Streams_Stream::$preloaded) {
		$preloaded = Db::exportArray($preloaded);
		Q_Response::setScriptData('Q.plugins.Streams.Stream.preloaded', $preloaded);
	}
	if (Q_Session::id()) {
		// We have a valid session. Generate a token for observe/neglect resources etc.
		$time = time();
		$duration = Q_Config::get('Streams', 'public', 'duration', 0);
		$permissions = Q_Config::get('Streams', 'public', 'permissions', array());
		if ($duration and $permissions) {
			$capability = Q_Utils::sign(array(
				'startTime' => $time,
				'endTime' => $time + $duration,
				'permissions' => $permissions
			));
			Q_Response::setScriptData('Q.plugins.Streams.public.capability', $capability);
		}
	}
}
