<?php

function Streams_batch_response_batch()
{
	if (empty($_REQUEST['batch'])) {
		throw new Q_Exception_RequiredField(array('field' => 'batch'));
	}
	
	try {
		$batch = json_decode($_REQUEST['batch'], true);
	} catch (Exception $e) {

	}
	if (empty($batch)) {
		throw new Q_Exception_WrongValue(array('field' => 'batch', 'range' => 'valid JSON'));
	}
	
	if (empty($batch['args'])) {
		throw new Q_Exception_RequiredField(array('field' => 'args'));
	}

	// Gather the publisher ids and stream names to fetch
	$toFetch = array();
	$withTotals = array();
	foreach ($batch['args'] as $args) {
		if (count($args) < 4) {
			continue;
		}
		list($action, $slots, $publisherId, $name) = $args;
		$toFetch[$publisherId][] = $name;
		if ($args[0] === 'message' and isset($args[4]['withTotals'])) {
			$wt = $args[4]['withTotals'];
		} else if ($args[0] === 'totals' and isset($args[4])) {
			$wt = $args[4];
		}
		if (isset($wt)) {
			$withTotals[$publisherId][$name] = $wt;
		}
	}
	$user = Users::loggedInUser();
	$userId = $user ? $user->id : "";
	
	// Fetch the actual streams
	$streams = array();
	foreach ($toFetch as $publisherId => $names) {
		if (empty($streams[$publisherId])) {
			$streams[$publisherId] = array();
		}
		$options = array('withParticipant' => true);
		if (!empty($withTotals[$publisherId])) {
			$options['withTotals'] = $withTotals[$publisherId];
		}
		$streams[$publisherId] = array_merge(
			$streams[$publisherId],
			Streams::fetch($userId, $publisherId, $names, '*', $options)
		);
	}
	
	// Now, build the result
	$result = array();
	foreach ($batch['args'] as $args) {
		try {
			$action = $args[0];
			$prev_request = $_REQUEST;
			$extra = !empty($args[4]) ? $args[4] : null;
			if (is_array($extra)) {
				foreach ($extra as $k => $v) {
					$_REQUEST[$k] = $v;
				}
			}
			switch ($action) {
			case 'stream':
				break;
			case 'message':
				if (!is_array($extra)) {
					$_REQUEST['ordinal'] = $extra;
				}
				break;
			case 'total':
				$_REQUEST['messageType'] = $extra;
				break;
			case 'participant':
				if (!is_array($extra)) {
					$_REQUEST['userId'] = $extra;
				}
				break;
			default:
				throw new Q_Exception_WrongValue(array(
					'field' => 'action',
					'range' => "'stream', 'message' or 'participant'"
				));
			}
			Q_Request::$slotNames_override = is_array($args[1]) ? $args[1] : explode(',', $args[1]);
			Q_Request::$method_override = 'GET';
			if (count($args) >= 4) {
				Streams::$requestedPublisherId_override = $publisherId = $args[2];
				Streams::$requestedName_override = $name = $args[3];
				if (empty($streams[$publisherId][$name])) {
					throw new Q_Exception_MissingRow(array(
						'table' => 'Stream', 
						'criteria' => "{publisherId: '$publisherId', name: '$name'}"
					));
				}
				Streams::$cache['stream'] = $streams[$publisherId][$name];
			}
			Q::event(
				"Streams/$action/response", 
				compact('streams', 'publisherId', 'name', 'extra', 'user', 'userId')
			);
			$slots = Q_Response::slots(true);
			unset($slots['batch']);
			$result[] = compact('slots');
			foreach ($slots as $k => $v) {
				Q_Response::clearSlot($k);
			}
		} catch (Exception $e) {
			$result[] = array('errors' => Q_Exception::toArray(array($e)));
		}
		$_REQUEST = $prev_request;
		Q_Request::$slotNames_override = null;
		Q_Request::$method_override = null;
		Streams::$requestedPublisherId_override = null;
		Streams::$requestedName_override = null;
	}
	
	return $result;
}