<?php

function Streams_fileManager_response_list($params = array()) {
    $fileManagerDir = $_SERVER['DOCUMENT_ROOT'] . '/../files/Streams/FileManager';
    $params = array_merge($_REQUEST, $params);
    $loggedUserId = Users::loggedInUser(true)->id;
    $usersFilesDir = $fileManagerDir . '/' . $loggedUserId;
    $currentDirStreamName = Q::ifset($params, 'currentDirStreamName', null);
    //print_r($parentStream);die('1111111');

    if(!is_null($currentDirStreamName) && $currentDirStreamName != 'Streams/fileManager/main'){

        $parentStream = Streams::fetchOne($loggedUserId, $loggedUserId, $currentDirStreamName);

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
        $rootStream = Streams::fetchOne($loggedUserId, $loggedUserId, 'Streams/fileManager/main');

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

    try {
        $related = $browsePathOfStream->related($loggedUserId)[1];
    } catch (Exception $exception) {
        $related = [];
    }

    Q_Response::setSlot("list", $related);
}