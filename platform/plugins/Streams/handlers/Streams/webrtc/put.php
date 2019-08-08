<?php

function Streams_webrtc_put($params = array()) {
    $params = array_merge($_REQUEST, $params);

    $loggedUserId = Users::loggedInUser(true)->id;
    $publisherId = Q::ifset($params, 'publisherId', null);
    $streamName = Q::ifset($params, 'streamName', null);
    $participantSid = Q::ifset($params, 'participantSid', null);

    if(Q_Request::slotName('updateParticipantSid')) {
		if ($publisherId && $streamName) {
			$stream = Streams::fetchOne($loggedUserId, $publisherId, $streamName);
			$meAsParticipant = $stream->participant();
			if ($meAsParticipant) {
				$meAsParticipant->setExtra('participantSid', $participantSid);
				$meAsParticipant->save();

				Q_Response::setSlot('updateParticipantSid', $meAsParticipant);
			}
		}
	} else if(Q_Request::slotName('endRoom')) {
		Q_Valid::requireFields(array('publisherId', 'adapter'), $params, true);
		$publisherId = Q::ifset($params, 'publisherId', null);
		$roomId = Q::ifset($params, 'roomId', null);

		switch ($params['adapter']) {
			case 'node':
				$adapter = 'node';
				break;
			case 'twilio':
				$adapter = 'twilio';
				break;
			default:
				throw new Q_Exception_WrongValue(array('field' => 'adapter', 'range' => 'node or twilio'));
		}

		$className = "Streams_WebRTC_".ucfirst($adapter);

		$webrtc = new $className();
		$result = $webrtc->endRoom($publisherId, $roomId);

		Q_Response::setSlot("endRoom", $result);
	}

}