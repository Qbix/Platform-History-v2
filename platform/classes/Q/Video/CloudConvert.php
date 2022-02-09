<?php
require_once Q_DIR.'/plugins/Q/vendor/autoload.php';
use \CloudConvert\CloudConvert;
use \CloudConvert\Models\Job;
use \CloudConvert\Models\Task;

/**
 * @module Q
 */
/**
 * @class Q_CloudConvert
 */
class Q_Video_CloudConvert {
	static function _setup () {
		$cloudconvert = new CloudConvert([
			'api_key' => Q_Config::expect("Q", "video", "cloudconvert", "key"),
			'sandbox' => false
		]);

		return $cloudconvert;
	}

	/**
	 * Upload file to CloudConvert
	 * @method convert
	 * @static
	 * @param {string} $inputFile Can be URL or local path
	 * @param {string} $outputFile local path where to put result file
	 * @param {string} [$key="my-file"] string key used in tasks names. This task name will be passed to webhook.
	 * @param {string} [$format="gif"]
	 * @return {array}
	 */
	static function convert ($inputFile, $key="my-file", $format="gif")	{
		$cloudconvert = self::_setup();

		if (filter_var($inputFile, FILTER_VALIDATE_URL)) {
			$job = (new Job())
				->addTask(
				(new Task('import/url', 'import-'.$key))
					->set('url', $inputFile)
				);
		} else {
			$job = (new Job())
				->addTask(
					new Task('import/upload','upload-'.$key)
				);
		}

		$job->addTask(
			(new Task('convert', 'convert-'.$key))
				->set('input', 'import-'.$key)
				->set('output_format', $format)
				->set('some_other_option', 'value')
			)
			->addTask(
				(new Task('export/url', 'export-'.$key))
					->set('input', 'convert-'.$key)
			);

		$cloudconvert->jobs()->create($job);

		// if local path, start uploading
		if (!filter_var($inputFile, FILTER_VALIDATE_URL)) {
			$uploadTask = $job->getTasks()->whereName('upload-'.$key)[0];
			$cloudconvert->tasks()->upload($uploadTask, fopen($inputFile, 'r'), basename($inputFile));
		}

		return compact("cloudconvert", "job");
	}
};