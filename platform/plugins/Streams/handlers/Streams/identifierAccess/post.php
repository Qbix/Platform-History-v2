<?php
require STREAMS_PLUGIN_DIR.DS.'vendor'.DS.'autoload.php';

function Streams_identifierAccess_post($params = array())
{
    $params = array_merge($_REQUEST, $params);
    $userId = Q::ifset($params, 'userId', Users::loggedInUser(true)->id);
    $identifierType = Q::ifset($params, 'identifierType', null);
    $asUserId = Users::loggedInUser(true)->id;
    $access = Q::ifset($params, 'accessValue', 'private');

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
	
    $changed = false;

    if(!$stream) {
	    Q_Response::setSlot("result", $changed);
    }
   
    if($access == 'private') {
        $stream->readLevel = 0;
        $changed = $stream->changed();
    } else if($access == 'public') {
       $stream->readLevel = 10;
       $changed = $stream->changed();
    }

	Q_Response::setSlot("result", $changed);
}