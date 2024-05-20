<?php

function Streams_fileManager_response_list($params = array()) {
    $fileManagerDir = $_SERVER['DOCUMENT_ROOT'] . '/../files/Streams/FileManager';
    $params = array_merge($_REQUEST, $params);
    $loggedUserId = Users::loggedInUser(true)->id;
    $usersFilesDir = $fileManagerDir . '/' . $loggedUserId;
    $currentDirStreamName = Q::ifset($params, 'currentDirStreamName', 'Streams/fileManager/main');
    $streamTypes = Q::ifset($params, 'streamTypes', null);
    $relationTypes = Q::ifset($params, 'relationTypes', null);

    $parentStream = Streams_Stream::fetch($loggedUserId, $loggedUserId, $currentDirStreamName);

    if(is_null($parentStream)) {
        $fields = array(
            'name' => $currentDirStreamName
        );
        if($currentDirStreamName == 'Streams/fileManager/main') {
            $fields['title'] = '/';
            $fields['content'] = $usersFilesDir;
        }
        $rootStream = Streams::create($loggedUserId, $loggedUserId, 'Streams/category', $fields);
    } else {
        $rootStream = $parentStream;
    }

    $browsePathOfStream = $rootStream;

    $criteria = array(
        'toPublisherId' => $browsePathOfStream->fields['publisherId'],
        'toStreamName' => $browsePathOfStream->fields['name']
    );

    if(!is_null($relationTypes)) {
        $criteria['type'] = $relationTypes;
    }

    $relationsQuery = Streams_RelatedTo::select()->where($criteria);
    $relations = $relationsQuery->fetchDbRows();

    $inCriteria = array_map('Streams_fileManager_response_list_mapRelations', $relations);

    $streamsCriteria = array(
        'publisherId, name' => $inCriteria
    );

    if(!is_null($streamTypes)) {
        $streamsCriteria['type'] = $streamTypes;
    }

    $query = Streams_Stream::select()->where($streamsCriteria);
				
    $relatedStreams = $query->ignoreCache()->fetchDbRows();

    Q_Response::setSlot("list", $relatedStreams);
}

function Streams_fileManager_response_list_mapRelations($v) {
    return array($v->fields['fromPublisherId'], $v->fields['fromStreamName']);
}