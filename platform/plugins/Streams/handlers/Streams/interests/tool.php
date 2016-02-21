<?php

function Streams_interests_tool($options)
{
	Q_Response::setToolOptions($options);
	$filter = Q::ifset($options, 'filter', true);
	return Q::view('Streams/tool/interests.php', compact('filter'));
}