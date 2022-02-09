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
	static function setup () {
		$cloudconvert = new CloudConvert([
			'api_key' => Q_Config::expect("Q", "video", "cloudconvert", "key"),
			'sandbox' => false
		]);

		return $cloudconvert;
	}

	static function getTaskKey () {
		return Q_Config::get("Q", "video", "cloudconvert", "taskKey", "my-file");
	}

	/**
	 * Upload file to CloudConvert
	 * @method convert
	 * @static
	 * @param {string} $inputFile Can be URL or local path
	 * @param {string} [$tag] Some local param which will need to identify this process with some local ID.
	 * @param {string} [$format="gif"]
	 * @param {array} [$options] Array with additional options
	 * @param {array} [$options.convert] Array with additional options pass to "convert" task
	 * @param {array} [$options.export] Array with additional options pass to "export" task
	 * @return {array}
	 */
	static function convert ($inputFile, $tag=null, $format="gif", $options=array())	{
		$taskKey = self::getTaskKey();
		$cloudconvert = self::setup();

		if (filter_var($inputFile, FILTER_VALIDATE_URL)) {
			$job = (new Job())
				->addTask(
				(new Task('import/url', 'import-'.$taskKey))
					->set('url', $inputFile)
				);
		} else {
			$job = (new Job())
				->addTask(
					new Task('import/upload','upload-'.$taskKey)
				);
		}

		$taskConvert = new Task('convert', 'convert-'.$taskKey);
		$taskConvert->set('input', 'import-'.$taskKey);
		$taskConvert->set('output_format', $format);
		foreach (Q::ifset($options, "convert", array()) as $key => $value) {
			$taskConvert->set($key, $value);
		}
		$job->addTask($taskConvert);

		$taskExport = new Task('export/url', 'export-'.$taskKey);
		$taskExport->set('input', 'convert-'.$taskKey);
		foreach (Q::ifset($options, "export", array()) as $key => $value) {
			$taskConvert->set($key, $value);
		}
		$job->addTask($taskExport);

		$job->setTag($tag);

		$cloudconvert->jobs()->create($job);

		// if local path, start uploading
		if (!filter_var($inputFile, FILTER_VALIDATE_URL)) {
			$uploadTask = $job->getTasks()->whereName('upload-'.$taskKey)[0];
			$cloudconvert->tasks()->upload($uploadTask, fopen($inputFile, 'r'), basename($inputFile));
		}

		return compact("cloudconvert", "job");
	}
};