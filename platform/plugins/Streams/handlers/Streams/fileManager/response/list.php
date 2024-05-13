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
    $criteria = array(
        'toPublisherId' => $categoryStream->fields['publisherId'],
        'toStreamName' => $categoryStream->fields['name']
    );
    if(!is_null($relationTypes)) {
        $criteria['type'] = $relationTypes;
    }
    $relationsQuery = Streams_RelatedTo::select()->where($criteria);
    $relations = $relationsQuery->fetchDbRows();
    $inCriteria = array_map('Streams_fileManager_response_list_mapRelations', $relations);
    if ($inCriteria) {
        $streamsCriteria = array(
            'publisherId, name' => $inCriteria
        );
        if(!is_null($streamTypes)) {
            $streamsCriteria['type'] = $streamTypes;
        }
        $query = Streams_Stream::select()->where($streamsCriteria);
        $relatedStreams = $query->ignoreCache()->fetchDbRows();
    } else {
        $relatedStreams = array();
    }
    Q_Response::setSlot("list", $relatedStreams);
}

function Streams_fileManager_response_list_mapRelations($v) {
    return array($v->fields['fromPublisherId'], $v->fields['fromStreamName']);
}