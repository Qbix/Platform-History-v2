<?php

function Streams_after_Users_Label_saveExecute($params)
{
	// The icon or title might have been modified
	$modifiedFields = $params['modifiedFields'];
	$label = $params['row'];
	$updates = Q::take($modifiedFields, array('icon', 'title'));
	$updates['userId'] = $label->userId;
	$updates['label'] = $label->label;
	return Streams_Message::post(null, $label->userId, "Streams/labels", array(
		'type' => 'Streams/labels/updated',
		'instructions' => compact('updates')
	), true);
}