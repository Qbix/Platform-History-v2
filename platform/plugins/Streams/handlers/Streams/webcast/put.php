<?php

function Streams_webrtc_put($params = array()) {
    $params = array_merge($_REQUEST, $params);

    $loggedUserId = Users::loggedInUser(true)->id;
    $publisherId = Q::ifset($params, 'publisherId', null);
    $streamName = Q::ifset($params, 'streamName', null);
    $participantSid = Q::ifset($params, 'participantSid', null);

    if(Q_Request::slotName('updateParticipantSid')) {
		Q_Response::setSlot('updateParticipantSid', true);
		if ($publisherId && $streamName) {
			$stream = Streams_Stream::fetch($loggedUserId, $publisherId, $streamName);
			$meAsParticipant = $stream->participant();
			if ($meAsParticipant) {
				$meAsParticipant->setExtra('participantSid', $participantSid);
				$meAsParticipant->save();
			}
		}
	} else if(Q_Request::slotName('endRoom')) {
		Q_Valid::requireFields(array('publisherId', 'adapter'), $params, true);
		$publisherId = Q::ifset($params, 'publisherId', null);
		$roomId = Q::ifset($params, 'roomId', null);

		switch ($params['adapter']) {
			case 'node':
				$adapter = 'node';
				break;
			case 'twilio':
				$adapter = 'twilio';
				break;
			default:
				throw new Q_Exception_WrongValue(array('field' => 'adapter', 'range' => 'node or twilio'));
		}

		$className = "Streams_WebRTC_".ucfirst($adapter);

		$webrtc = new $className();
		$result = $webrtc->endRoom($publisherId, $roomId);

		Q_Response::setSlot("endRoom", $result);
	} else if(Q_Request::slotName('updateLog')) {
        $publisherId = Q::ifset($params, 'publisherId', null);
        $roomId = Q::ifset($params, 'roomId', null);
        $participant = Q::ifset($params, 'participant', null);
        $toSave = Q::ifset($params, 'log', null);

        if($toSave == null) {
            Q_Response::setSlot("updateLog", null);
            return;
        }

        $logsDirectory = str_replace('/', DS, Q_Config::get('Q', 'logs', 'directory', 'Q/logs'));
        $logsPath = (defined('APP_FILES_DIR') ? APP_FILES_DIR : Q_FILES_DIR).DS.$logsDirectory.DS.'webrtc';

        $streamName = "Streams/webrtc/$roomId";
        $stream = Streams_Stream::fetch($publisherId, $publisherId, $streamName);
        $startTime = date('YmdHis', round($stream->getAttribute('startTime') / 1000));

        $folderName = $roomId . '_' . $startTime;

        $path = $logsPath . DS . $folderName;
        $participantInfo = preg_split('/\t/', $participant);
        $filename = $participantInfo[0] . '_' . $participantInfo[1] . '.log';
        $mask = umask(0000);

        if (!file_exists($path)) {
            if (!@mkdir($path, 0777, true)) {
                throw new Q_Exception_FilePermissions(array('action' => 'create', 'filename' => $path, 'recommendation' => ' Please set the app files directory to be writable.'));
            }
        }

        $toSave = file_exists($path.DS.$filename) && filesize($path.DS.$filename)
			? ',' . PHP_EOL . trim($toSave,"[]")
			: trim($toSave,"[]");
        $result = file_put_contents($path.DS.$filename, $toSave, FILE_APPEND);


        //removeOldLogs($logsPath);
        umask($mask);

		Q_Response::setSlot("updateLog", $toSave);
	}
}

function deleteDir($dir) {
    $it = new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS);
    $files = new RecursiveIteratorIterator($it,
        RecursiveIteratorIterator::CHILD_FIRST);
    foreach($files as $file) {
        if ($file->isDir()){
            rmdir($file->getRealPath());
        } else {
            unlink($file->getRealPath());
        }
    }
    rmdir($dir);
}
//remove logs that are older than 7 days
function removeOldLogs($logsPath) {
    $dirs = array_filter(glob($logsPath . '/*'), 'is_dir');
    foreach ($dirs as $dir) {
        $dirInfo = pathinfo($dir);
        $logsDate = explode('_', $dirInfo['basename'])[1];
        $timestump = strtotime($logsDate);
        $path = $dirInfo['dirname'] . DS . $dirInfo['basename'] ;

        if(time() - $timestump > 604800) {
            deleteDir($path);
        }
    }
}
