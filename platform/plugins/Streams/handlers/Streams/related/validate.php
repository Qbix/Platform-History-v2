<?php

function Streams_related_validate()
{
	switch (Q_Request::method()) {
		case 'POST':
			$required = array('toPublisherId', 'toStreamName', 'type', 'fromPublisherId', 'fromStreamName');
			break;
		case 'DELETE':
			$required = array('toPublisherId', 'toStreamName', 'type', 'fromPublisherId', 'fromStreamName');
			break;
		case 'PUT':
			$required = array('toPublisherId', 'toStreamName', 'type', 'fromPublisherId', 'fromStreamName', 'weight');
			if (isset($_REQUEST['adjustWeights'])) {
				if (!is_numeric($_REQUEST['adjustWeights'])) {
					Q_Response::addError(new Q_Exception_WrongValue(
						array('field' => 'adjustWeights', 'range' => 'a numeric value'),
						'adjustWeights'
					));
				}
			}
			break;
		case 'GET':
			$required = array();
			break;
	}
	foreach ($required as $r) {
		if (!isset($_REQUEST[$r])) {
			Q_Response::addError(new Q_Exception_RequiredField(array('field' => $r)));
		}
	}
}
