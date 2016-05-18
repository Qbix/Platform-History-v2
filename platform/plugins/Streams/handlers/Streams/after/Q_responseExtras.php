<?php

function Streams_after_Q_responseExtras() {
	if ($preloaded = Streams_Stream::$preloaded) {
		$preloaded = Db::exportArray($preloaded);
		Q_Response::setScriptData('Q.plugins.Streams.Stream.preloaded', $preloaded);
	}
	$states = Streams_Participant::states();
	Q_Response::setScriptData('Q.plugins.Streams.Participant.states', $states);
}
