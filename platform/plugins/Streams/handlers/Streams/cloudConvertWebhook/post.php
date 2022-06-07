<?php
use \CloudConvert\Models\Task;

/**
 * @module Streams
 */

/**
 * @class HTTP CloudConvert webhook
 * @method post
 * @param {array} [$_REQUEST]
 */
function Streams_cloudConvertWebhook_post()
{
	$taskKey = Q_Video_CloudConvert::getTaskKey();
	$cloudConvert = Q_Video_CloudConvert::setup();
	$signingSecretFinished = Q_Config::expect("Q", "video", "cloudConvert", "webhooks", "finished");
	$signingSecretFailed = Q_Config::expect("Q", "video", "cloudConvert", "webhooks", "failed");

	$payload = @file_get_contents('php://input');
	$signature = $_SERVER['HTTP_CLOUDCONVERT_SIGNATURE'];
	Q::log("signature: ".$signature, "cloudConvert");

	function Streams_cloudConvert_post_exit () {
		header("HTTP/1.1 200 OK");
		exit;
	}

	try {
		$webhookEvent = $cloudConvert->webhookHandler()->constructEvent($payload, $signature, $signingSecretFinished);
		Q::log("FINISHED:", "cloudConvert");
		Q::log($payload, "cloudConvert", array("maxLength" => 100000));

		$job = $webhookEvent->getJob();

		$tag = json_decode($job->getTag(), true, 512, JSON_THROW_ON_ERROR); // can be used to store an ID
		$publisherId = $tag["publisherId"];
		$streamName = $tag["streamName"];
		$stream = Streams::fetchOne($publisherId, $publisherId, $streamName, true);
		$directory = $stream->iconDirectory();
		if (!is_dir($directory) && !@mkdir($directory, 0777, true)) {
			throw new Q_Exception_FilePermissions(array(
				'action' => 'create',
				'filename' => $directory,
				'recommendation' => ' Please set your files directory to be writable.'
			));
		}

		$exportTask = $job->getTasks()
			->whereStatus(Task::STATUS_FINISHED) // get the task with 'finished' status ...
			->whereName('export-'.$taskKey)[0];

		$file = $exportTask->getResult()->files[0];
		$source = $cloudConvert->getHttpTransport()->download($file->url)->detach();
		$fileName = preg_replace("/.*\./", "converted.", $file->filename);
		$dest = fopen($directory.DS.$fileName, 'w');
		stream_copy_to_stream($source, $dest);

		$urlFromDir = str_replace(APP_FILES_DIR.DS.Q::app().DS, "{{baseUrl}}/Q/", $directory);
		$urlFromDir = str_replace('\\', '/', $urlFromDir);
		$stream->icon = $urlFromDir."/".$fileName;
		$stream->changed();
	} catch(\CloudConvert\Exceptions\UnexpectedDataException $e) {
		Q::log("Finished/UnexpectedDataException: ".$e->getMessage(), "cloudConvert");
		Streams_cloudConvert_post_exit();
	} catch(\CloudConvert\Exceptions\SignatureVerificationException $e) {
		try {
			$webhookEvent = $cloudConvert->webhookHandler()->constructEvent($payload, $signature, $signingSecretFailed);
			Q::log("FAILED:", "cloudConvert");
			Q::log($payload, "cloudConvert", array("maxLength" => 100000));
		} catch(\CloudConvert\Exceptions\UnexpectedDataException $e) {
			Q::log("Failed/UnexpectedDataException: ".$e->getMessage(), "cloudConvert");
			Streams_cloudConvert_post_exit();
		} catch(\CloudConvert\Exceptions\SignatureVerificationException $e) {
			Q::log($e->getMessage(), "cloudConvert");
			Streams_cloudConvert_post_exit();
		}

		Streams_cloudConvert_post_exit();
	}
}