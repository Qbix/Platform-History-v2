<?php

function Streams_webrtc_response_logRoomList($params = array()) {
    $params = array_merge($_REQUEST, $params);
    $loggedUserId = Users::loggedInUser(true)->id;

    $logsDirectory = str_replace('/', DS, Q_Config::get('Q', 'logs', 'directory', 'Q/logs'));
    $logsPath = (defined('APP_FILES_DIR') ? APP_FILES_DIR : Q_FILES_DIR).DS.$logsDirectory.DS.'webrtc';

    $dirs = array_filter(glob($logsPath . '/*'), 'is_dir');
    $rooms = [];
    foreach ($dirs as $dir) {
        $dirInfo = pathinfo($dir);
        $name = explode('_', $dirInfo['basename']);
        $roomName = $name[0];
        $logsDate = $name[1];
        $timestump = strtotime($logsDate);
        $readableDate = date("d/m/Y H:i:s", $timestump);

        $roomInfo = [
            'fullName' => $dirInfo['basename'],
            'roomName' => $roomName,
            'date' => $readableDate,
            'startTimeDate' => $logsDate,
            'startTimeTs' => $timestump,
        ];

        array_push($rooms, $roomInfo);

    }

    usort($rooms, function($a, $b) {
        return $a['startTimeTs'] + $b['startTimeTs'];
    });

    Q_Response::setSlot("logRoomList", $rooms);
}