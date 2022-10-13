<?php

function Streams_identifierAccess_response_readLevel($params = array()) {
    $params = array_merge($_REQUEST, $params);
    $userId = Q::ifset($params, 'userId', Users::loggedInUser(true)->id);
    $asUserId = Users::loggedInUser(true)->id;
    $identifierType = Q::ifset($params, 'identifierType', null);
   
    if (!isset($identifierType)) {
		throw new Q_Exception_RequiredField(array('field' => 'identifierType'));
	}

    if($identifierType == 'email') {
        $stream = Streams::fetchOneOrCreate($asUserId, $userId, 'Streams/user/emailAddress');
    } else if($identifierType == 'mobile') {
        $stream = Streams::fetchOneOrCreate($asUserId, $userId, 'Streams/user/mobileNumber');
    } else {
        throw new Q_Exception(array('field' => 'identifierType'), 'data');
    }

    Q_Response::setSlot("readLevel", $stream->readLevel);
}