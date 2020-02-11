<?php

function Streams_webrtc_response_logParticipantList($params = array()) {
    $params = array_merge($_REQUEST, $params);

    $loggedUserId = Users::loggedInUser(true)->id;
    $roomId = Q::ifset($params, 'roomId', null);
    $startTimeDate = Q::ifset($params, 'startTimeDate', null);

    $logsDirectory = str_replace('/', DS, Q_Config::get('Q', 'logs', 'directory', 'Q/logs'));
    $logsPath = (defined('APP_FILES_DIR') ? APP_FILES_DIR : Q_FILES_DIR).DS.$logsDirectory.DS.'webrtc';

    $path = $logsPath . DS . $roomId . '_' . $startTimeDate ;
    $files = array_diff(scandir($path), array('.', '..'));

    $roomsParticipants = [];
    foreach ($files as $file) {
        $fileInfo = pathinfo($file);
        $name = explode('_', $fileInfo['filename']);
        $userId = $name[0];
        $connectedTime = $name[1];
        $connectedTimeDate = date("H:i:s", (int) $connectedTime);

        $user = Users::fetch($userId, false);
        $participantInfo = [
            'fullName' => $fileInfo['filename'],
            'userId' => $userId,
            'connectedTime' => $connectedTime,
            'connectedDateTime' => $connectedTimeDate,
            'username' => $user->displayName(),
        ];

        array_push($roomsParticipants, $participantInfo);

    }


    usort($roomsParticipants, function($a, $b) {
        return $a['connectedTime'] + $b['connectedTime'];
    });

    Q_Response::setSlot("logParticipantList", $roomsParticipants);
}