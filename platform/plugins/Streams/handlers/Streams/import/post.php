<?php

/**
 * @module Streams
 */

/**
 * Can be used by $app/admins of a community.
 * Starts a Streams/task to create users from an uploaded csv file, and
 * invite them to the "Streams/experience/main" stream, as well as any
 * other experience streams named in the csv.
 * @class HTTP Streams import
 * @method post
 * @param {array} [$_REQUEST]
 * @param {string} [$_REQUEST.communityId=Users::communityId] If you want to override it
 * @param {string} [$_REQUEST.taskStreamName] Pass the name of a task stream to resume it.
 *    In this case, you don't need to pass the file, because it was saved.
 * @param {array} [$_FILES] Array consisting of one or more CSV files.
 *  The first line consists of titles or names of streams loaded from
 *  JSON files named under Streams/userStreams config.
 *  The users are invited to the "Streams/experience/main" experience,
 *  and any other experiences listed in the "Experiences" column, if it
 *  is present in the CSV file.
 * @return {void}
 */
function Streams_import_post()
{
	$luid = Users::loggedInUser(true)->id;
	$communityId = Q::ifset($_REQUEST, 'communityId', Users::communityId());

	$all = Streams::userStreamsTree()->getAll();
	$exceptions = array();
	$users = array();

	$task = isset($_REQUEST['taskStreamName'])
		? Streams::fetchOne($luid, $communityId, $_REQUEST['taskStreamName'], true)
		: Streams::create($luid, $communityId, 'Streams/task', array(
			'skipAccess' => true,
			'title' => 'Importing members into ' . Users::communityName()
		));
	$task->addPreloaded();
	Q_Response::setSlot('taskStreamName', $task->name);

	// TODO: make a cron to resume unfinished tasks

	$dest = APP_FILES_DIR . DS . 'Streams' . DS . 'tasks';
	if (!is_dir($dest)) {
		mkdir($dest, fileperms(APP_FILES_DIR), true);
	}
	$parts = explode('/', $task->name);
	$taskId = end($parts);
	$filename = $dest . DS . "$taskId.csv";
	if (!empty($_FILES)) {
		$file = reset($_FILES);
		$tmp = $file['tmp_name'];
		move_uploaded_file($tmp, $filename);
	}
	if (!file_exists($filename)) {
		throw new Q_Exception_MissingFile(array('filename' => $filename));
	}

	// Send the response and keep going.
	// WARN: this potentially ties up the PHP thread for a long time
	$timeLimit = Q_Config::get('Streams', 'import', 'timeLimit', 100000);
	ignore_user_abort(true);
	set_time_limit($timeLimit);
	Q_Dispatcher::response(true);
	session_write_close();

	$fp = fopen($filename, 'r');
	$fields = fgetcsv($fp, 0, ',');
	if ($fields === false) {
		return;
	}
	$emailAddressKey = Q_Utils::normalize('Email Address');
	$mobileNumberKey = Q_Utils::normalize('Mobile Number');
	$processed = $task->getAttribute('processed', 0);

	// count the number of rows
	$lineCount = 0;
	$fp = fopen($filename,  'r');
	if ($fp) {
		while (!feof($fp)) {
			if ($content = fgets($fp)) {
				++$lineCount;
			}
		}
	}
	fclose($fp);

	// start parsing the rows
	$j = 0;
	while ($row = fgetcsv($fp, 0, ',')) {
		if (++$j <= $processed) {
			continue;
		}
		$notEmpty = false;
		foreach ($row as $v) {
			if ($v) {
				$notEmpty = true;
				break;
			}
		}
		if (!$notEmpty) {
			continue;
		}

		// get the data from the row
		$data = array();
		$importUserData = array();
		$streamNames = array();
		foreach ($row as $i => $value) {
			$field = $fields[$i];
			$fn = Q_Utils::normalize($field);
			$data[$fn] = $value;
			if ($fn === 'experiences') {
				$experiences = explode("\n", $value);
				foreach ($experiences as $experience) {
					$streams = Streams::lookup($communityId, 'Streams/experience', $value);
					$stream = reset($streams);
					if (!$stream) {
						$vn = Q_Utils::normalize($value);
						$stream = Streams::fetchOne($luid, $communityId, "Streams/experience/$vn");
						if (!$stream) {
							$stream = Streams::create($luid, $communityId, 'Streams/experience', array(
								'name' => "Streams/experience/$vn",
								'title' => $value
							));
						}
					}
					$streamNames[] = $stream->name;
				}
				continue;
			}
			if ($fn === 'labels') {
				$labelTitles = explode("\n", $value);
				continue;
			}
			foreach ($all as $n => $info) {
				if ($fn === Q_Utils::normalize($n)
				or $fn === Q_Utils::normalize(Q::ifset($info, 'title', ''))) {
					$importUserData[$n] = $value;
					break;
				}
			}
		}

		try {
			$streams = Streams::fetch($luid, $communityId, $streamNames);
			foreach ($streams as $stream) {
				if (!$stream->testAdminLevel('manage')) {
					throw new Users_Exception_NotAuthorized();
				}
			}

			// prepare the identifier
			Users::$cache['importUserData'] = $importUserData;
			$emailAddress = Q::ifset($data, $emailAddressKey, null);
			$mobileNumber = Q::ifset($data, $mobileNumberKey, null);
			if ($mobileNumber and $emailAddress) {
				if (Users::identify('mobile', $mobileNumber)) {
					$identifier = $mobileNumber;
					$alsoAddEmail = $emailAddress;
				} else if (Users::identify('email', $emailAddress)) {
					$identifier = $emailAddress;
					$alsoAddMobile = $mobileNumber;
				} else {
					$identifier = $mobileNumber;
					$alsoAddEmail = $emailAddress;
				}
			} else if ($mobileNumber) {
				$identifier = $mobileNumber;
			} else if ($emailAddress) {
				$identifier = $emailAddress;
			} else {
				continue; // no one to invite
			}
			$identifier = $mobileNumber ? $mobileNumber : $emailAddress;

			// invite the user
			$sn = 'Streams/experience/main';
			$result = Streams::invite($communityId, $sn, compact('identifier'));
			Users::$cache['importUserData'] = null; // already saved this data
			$userId = reset($result['userIds']);
			$users[$userId] = $user = Users::fetch($userId, true);
			if (isset($alsoAddEmail)) {
				$user->addEmail($alsoAddEmail); // sends addEmail message
			}
			if (isset($alsoAddMobile)) {
				$user->addMobile($alsoAddMobile); // sends addMobile message
			}
			$task->setAttribute('processed', $j);
			$task->setAttribute('completed', min($j / $lineCount, 1));
			$task->post($luid, array(
				'type' => 'Streams/task/progress',
				'instructions' => compact('mobileNumber', 'emailAddress', 'user', 'processed', 'completed'),
			), true);
			foreach ($streamNames as $sn) {
				// the following sends an invite message and link by email or mobile
				Streams::invite($communityId, $sn, compact('identifier'));
			}
			if (!empty($labelTitles)) {
				$labels = Users_Label::fetch($luid);
				foreach ($labelTitles as $title) {
					$found = false;
					foreach ($labels as $label) {
						if ($label->title = $title) {
							$found = true;
							break;
						}
					}
					$tn = Q_Utils::normalize($title);
					$label = "Users/$tn";
					if (!$found) {
						Users_Label::addLabel($label, $communityId, $title, $luid);
					}
					Users_Contact::addContact($communityId, $label, $userId, null, $luid);
				}
			}
		} catch (Exception $e) {
			$exceptions[$j] = $e;
		}
	}
	// if we reached here, then the task has completed
	unlink($filename); // remove the file
	$task->post($luid, array(
		'type' => 'Streams/task/complete'
	), true);
}