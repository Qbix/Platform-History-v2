<?php

function Streams_fileManager_response_list($params = array()) {
    $fileManagerDir = $_SERVER['DOCUMENT_ROOT'] . '/../files/Streams/FileManager';
    $params = array_merge($_REQUEST, $params);
    $loggedUserId = Users::loggedInUser(true)->id;
    $usersFilesDir = $fileManagerDir . '/' . $loggedUserId;
    $currentDirStreamName = Q::ifset($params, 'currentDirStreamName', 'currentDirStreamName');
    $streamTypes = Q::ifset($params, 'streamTypes', null);
    $relationTypes = Q::ifset($params, 'relationTypes', null);
    //print_r($categoryStream);die('1111111');

    $categoryStream = Streams_Stream::fetch($loggedUserId, $loggedUserId, $currentDirStreamName);
    if (!$categoryStream) {
        $fields['name'] = $currentDirStreamName;
        if ($currentDirStreamName === 'Streams/fileManager/main') {
            $fields['title'] = '/';
            $fields['content'] = $usersFilesDir;
        }
        $categoryStream = Streams::create($loggedInUserId, $loggedInUserId, $type, $fields);
    }
    $streams = Streams::related($loggedInUserId, $categoryStream->publisherId, $categoryStream->name, true, array(
        'streamsOnly' => true,
        'fetchPublicStreams' => true,
        'ignoreCache' => true
    ));
    Q_Response::setSlot("list", $streams);
}

function Streams_fileManager_response_list_mapRelations($v) {
    return array($v->fields['fromPublisherId'], $v->fields['fromStreamName']);
}