<?php

function Streams_after_Users_Label_removeExecute($params)
{
	$label = $params['row'];
	Streams_Message::post(null, $label->userId, 'Streams/labels', array(
		'type' => 'Streams/labels/removed',
		'instructions' => array('label' => $label->toArray())
	), true);
}