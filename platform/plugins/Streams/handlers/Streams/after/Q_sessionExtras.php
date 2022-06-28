<?php

function Streams_after_Q_sessionExtras()
{
	if ($preloaded = Streams_Stream::$preloaded) {
		$preloaded = Db::exportArray($preloaded);
		Q_Response::setScriptData('Q.plugins.Streams.Stream._preloaded', $preloaded);
	}
	if ($arePublic = Streams::$arePublic) {
		Q_Response::setScriptData('Q.plugins.Streams._public', $arePublic);
	}
	if ($preloaded = Streams_Avatar::$preloaded) {
		$preloaded = Db::exportArray($preloaded);
		Q_Response::setScriptData('Q.plugins.Streams.Avatar._preloaded', $preloaded);
	}
}
