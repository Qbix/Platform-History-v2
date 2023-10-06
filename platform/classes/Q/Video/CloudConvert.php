<?php
require_once Q_DIR.'/plugins/Q/vendor/autoload.php';
use \CloudConvert\CloudConvert;
use \CloudConvert\Models\Job;
use \CloudConvert\Models\Task;

/**
 * @module Q
 */
/**
 * @class Q_Video_CloudConvert
 */
class Q_Video_CloudConvert extends Q_Video {
	static function setup () {
		$cloudConvert = new CloudConvert([
			'api_key' => Q_Config::expect("Q", "video", "cloud", "convert", "cloudConvert", "key"),
			'sandbox' => false
		]);

		return $cloudConvert;
	}

	static function getTaskKey () {
		return Q_Config::get("Q", "video", "cloud", "convert", "cloudConvert", "taskKey", "uploadedFile");
	}

	/**
	 * Upload file to CloudConvert
	 * @method doConvert
	 * @param {string} $src Can be URL or local path
	 * @param {array} [$params] Array with additional params
	 * @param {string} [$params.tag] Some local param which will need to identify this process with some local ID.
	 * @param {Streams_Stream} [$params.stream]
	 * @param {string} [$params.format="gif"]
	 * @param {array} [$params.convert] Array with additional params pass to "convert" task
	 * @param {array} [$params.export] Array with additional params pass to "export" task
	 * @return {array}
	 */
	function doConvert ($src, $params=array())	{
		if (Q_Config::get("Q", "environment", null) == "local") {
			return false; // wrong environment, webhooks may not work etc.
		}

		$taskKey = self::getTaskKey();
		$cloudConvert = self::setup();

		$convert = Q::ifset($params, "convert", array());
		$export = Q::ifset($params, "export", array());
		$stream = Q::ifset($params, "stream", null);
		$tag = null;
		if ($stream instanceof Streams_Stream) {
			$tag = json_encode(array(
				"publisherId" => $stream->publisherId,
				"streamName" => $stream->name
			));
		}

		$format = strtolower(Q::ifset($params, 'format', 'gif'));

		if (filter_var($src, FILTER_VALIDATE_URL)) {
			$job = (new Job())
				->addTask(
				(new Task('import/url', 'import-'.$taskKey))
					->set('url', $src)
				);
		} else {
			$job = (new Job())
				->addTask(
					new Task('import/upload','import-'.$taskKey)
				);
		}

		$taskConvert = new Task('convert', 'convert-'.$taskKey);
		$taskConvert->set('input', 'import-'.$taskKey);
		$taskConvert->set('output_format', $format);
		foreach ($convert as $key => $value) {
			$taskConvert->set($key, $value);
		}
		$job->addTask($taskConvert);

		$taskExport = new Task('export/url', 'export-'.$taskKey);
		$taskExport->set('input', 'convert-'.$taskKey);
		foreach ($export as $key => $value) {
			$taskConvert->set($key, $value);
		}
		$job->addTask($taskExport);
		$job->setTag($tag);
		$cloudConvert->jobs()->create($job);
		if (!filter_var($src, FILTER_VALIDATE_URL)) {
			// if local path, start uploading
			$uploadTask = $job->getTasks()->whereName('import-'.$taskKey)[0];
			$cloudConvert->tasks()->upload($uploadTask, fopen($src, 'r'), basename($src));
		}
		return compact("cloudConvert", "job");
	}
};