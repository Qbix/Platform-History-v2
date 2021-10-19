<?php

function Streams_after_Users_Label_saveExecute($params)
{
	// The icon or title might have been modified
	$inserted = $params['inserted'];
	$modifiedFields = $params['modifiedFields'];
	$label = $params['row'];
	if ($inserted) {
		Streams_Message::post(null, $label->userId, 'Streams/labels', array(
			'type' => 'Streams/labels/inserted',
			'instructions' => array('label' => $label->exportArray())
		), true);
	} else {
		$updates = Q::take($modifiedFields, array('icon', 'title'));
		$updates = array_merge($label->toArray(), $updates);
		Streams_Message::post(null, $label->userId, "Streams/labels", array(
			'type' => 'Streams/labels/updated',
			'instructions' => @compact('updates')
		), true);
	}
}