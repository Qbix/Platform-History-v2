<?php

function Streams_fileManager_response_list($params = array()) {
    $fileManagerDir = $_SERVER['DOCUMENT_ROOT'] . '/../files/Streams/FileManager';
    $params = array_merge($_REQUEST, $params);
    $loggedUserId = Users::loggedInUser(true)->id;
    $usersFilesDir = $fileManagerDir . '/' . $loggedUserId;
    $currentDirStreamName = Q::ifset($params, 'currentDirStreamName', null);
    $streamTypes = Q::ifset($params, 'streamTypes', null);
    $relationTypes = Q::ifset($params, 'relationTypes', null);
    //print_r($parentStream);die('1111111');

    if(!is_null($currentDirStreamName) && $currentDirStreamName != 'Streams/fileManager/main'){

        $parentStream = Streams_Stream::fetch($loggedUserId, $loggedUserId, $currentDirStreamName);

        if(is_null($parentStream)) {
            $fields = array(
                'name' => $currentDirStreamName
            );
            $rootStream = Streams::create($loggedUserId, $loggedUserId, 'Streams/category', $fields);
        } else {
            $rootStream = $parentStream;
        }



        $browsePathOfStream = $rootStream;
    } else {
        $rootStream = Streams_Stream::fetch($loggedUserId, $loggedUserId, 'Streams/fileManager/main');

        if(is_null($rootStream)) {
            $fields = array(
                'title' => '/',
                'name' => 'Streams/fileManager/main',
                'content' => $usersFilesDir
            );
            $rootStream = Streams::create($loggedUserId, $loggedUserId, 'Streams/fileManager', $fields);
        }

        $browsePathOfStream = $rootStream;

    }
    $criteria = array(
        'toPublisherId' => $browsePathOfStream->fields['publisherId'],
        'toStreamName' => $browsePathOfStream->fields['name']
    );

    if(!is_null($relationTypes)) {
        $criteria['type'] = $relationTypes;
    }

    $relationsQuery = Streams_RelatedTo::select()->where($criteria);
    $relations = $relationsQuery->fetchDbRows();

    function mapRelations($v) {
        return array($v->fields['fromPublisherId'], $v->fields['fromStreamName']);
    }

    $inCriteria = array_map('mapRelations', $relations);

    $streamsCriteria = array(
        'publisherId, name' => $inCriteria
    );

    if(!is_null($streamTypes)) {
        $streamsCriteria['type'] = $streamTypes;
    }

    $query = Streams_Stream::select($fields)->where($streamsCriteria);
				
    $relatedStreams = $query->ignoreCache()->fetchDbRows();

    Q_Response::setSlot("list", $relatedStreams);
}