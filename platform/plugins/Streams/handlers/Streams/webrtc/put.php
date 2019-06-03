<?php

function Streams_webrtc_put($params = array()) {
    $params = array_merge($_REQUEST, $params);

    $loggedUserId = Users::loggedInUser(true)->id;
    $publisherId = Q::ifset($params, 'publisherId', null);
    $streamName = Q::ifset($params, 'streamName', null);
    $twilioParticipantSid = Q::ifset($params, 'twilioParticipantSid', null);

    if($publisherId && $streamName) {
        $stream = Streams::fetchOne($loggedUserId, $publisherId, $streamName);
        $meAsParticipant = $stream->participant();
        if($meAsParticipant) {
            $meAsParticipant->setExtra('twilioParticipantSid', $twilioParticipantSid);
            $meAsParticipant->save();

            Q_Response::setSlot('updateParticipantSid', $meAsParticipant);
        }
    }
}