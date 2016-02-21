<?php

function Streams_player_tool($options)
{
	extract($options);
	if (!isset($stream)) {
		throw new Q_Exception_MissingObject(array('name' => 'stream'));
	}
	if (!$stream->testReadLevel('content')) {
		$streamName_html = Q_Html::text($stream->name);
		return "<a href='#$streamName_html'>hidden</a>";
	}
	$parts = explode('/', $stream->type);
	switch ($parts[0]) {
		case 'Streams/text/small':
		case 'Streams/text/medium':
		case 'Streams/text':
			return $stream->content;
		case 'Streams/date':
			// TODO: localize
			if (isset($parts[1]) and $parts[1] === 'birthday') {
				return date('M j', strtotime($stream->content));
			}
			return date('M j, Y', strtotime($stream->content));
		case 'Streams/number':
			if (isset($parts[1]) and $parts[1] === 'age') {
				if (!empty($streams['Streams/user/birthday']->content)) {
					return Db::ageFromDateTime($streams['Streams/user/birthday']->content);
				}
				return null;
			}
			return $strem->content;
		case 'Streams/category': // TODO: implement
		case 'Streams/chat': // TODO: implement
		default:
			return Q::event("Streams/player/{$stream->type}", $options);
			// return $stream->content;
	}
}