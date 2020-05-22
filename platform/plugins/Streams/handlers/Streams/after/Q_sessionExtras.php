<?php

function Streams_after_Q_sessionExtras()
{
	if ($preloaded = Streams_Stream::$preloaded) {
		$preloaded = Db::exportArray($preloaded);
		Q_Response::setScriptData('Q.plugins.Streams.Stream.preloaded', $preloaded);
	}
	if ($preloaded = Streams_Avatar::$preloaded) {
		$preloaded = Db::exportArray($preloaded);
		Q_Response::setScriptData('Q.plugins.Streams.Avatar.preloaded', $preloaded);
	}
}
