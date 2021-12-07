<?php

function Streams_fileManager_response_list($params = array()) {
    $fileManagerDir = $_SERVER['DOCUMENT_ROOT'] . '/../files/Streams/FileManager';
    $params = array_merge($_REQUEST, $params);
    $loggedUserId = Users::loggedInUser(true)->id;
    $usersFilesDir = $fileManagerDir . '/' . $loggedUserId;
    $currentDirStreamName = Q::ifset($params, 'currentDirStreamName', null);
    //print_r($parentStream);die('1111111');

    if(!is_null($currentDirStreamName) && $currentDirStreamName != 'Streams/fileManager/main'){
        /*$parentStream = Streams_Stream::select()->where(array(
            'publisherId' => $loggedUserId,
            'name' => $currentDirStreamName,
            'type' => 'Streams/category'
        ))->limit(1)->fetchAll(PDO::FETCH_ASSOC);*/

        $parentStream = Streams::fetchOne($loggedUserId, $loggedUserId, $currentDirStreamName);


        //$rootStream = Streams::fetchOne($loggedUserId, $loggedUserId, 'Streams/fileManager/');
       // print_r($loggedUserId);
        //print_r($currentDirStreamName);
        //print_r($parentStream);die('1111111');


        if(count($parentStream) == 0) {
            $fields = array(
                'name' => $currentDirStreamName
            );
            $rootStream = Streams::create($loggedUserId, $loggedUserId, 'Streams/category', $fields);
        } else {
            $rootStream = $parentStream;
        }



        $browsePathOfStream = $rootStream;
    } else {
       /* $rootStream = Streams_Stream::select()->where(array(
            'publisherId' => $loggedUserId,
            'name' => 'Streams/fileManager/main',
            'type' => 'Streams/fileManager'
        ))->limit(1)->fetchAll(PDO::FETCH_ASSOC);*/
        $rootStream = Streams::fetchOne($loggedUserId, $loggedUserId, 'Streams/fileManager/main');

        //print_r($rootStream);die('1111111');


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
    //print_r($browsePathOfStream);die('222222');


    /*$relatedContent = Streams_RelatedTo::select()->where(array(
        "toPublisherId" => $browsePathOfStream['publisherId'],
        "toStreamName" => $browsePathOfStream['name'],
    ))->orderBy("weight", false)->fetchAll(PDO::FETCH_ASSOC);*/


    try {
        $related = $browsePathOfStream->related($loggedUserId)[1];
    } catch (Exception $exception) {
        $related = [];
    }
    //print_r($related);die('33333');

    Q_Response::setSlot("list", $related);
}