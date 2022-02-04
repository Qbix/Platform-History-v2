<?php
/**
 * @module Q
 */
/**
 * @class Q_Muse
 */
class Q_Video_Muse {
	/**
	 * Upload file to muse.ai
	 * @method upload
	 * @static
	 * @param {string} $filePath
	 * @return {array}
	 */
	static function upload($filePath)
	{
		$uploadEndPoint = Q_Config::get("Q", "video", "muse", "uploadEndPoint", null);
		$museApiKey = Q_Config::get("Q", "video", "muse", "key", null);
		if (!$museApiKey) {
			throw new Exception("Muse API key not found");
		}
		if (!$uploadEndPoint) {
			throw new Exception("Muse end point url not found");
		}

		$fileName = basename($filePath);
		$mimeType = finfo_file(finfo_open(FILEINFO_MIME_TYPE), $filePath);
		$cFile = curl_file_create($filePath, $mimeType, $fileName);
		$headers = array(
			"Content-type: multipart/form-data",
			"Key: $museApiKey"
		);
		$fields = array(
			"file" => $cFile,
			"visibility" => "unlisted"
		);

		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $uploadEndPoint);
		curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
		curl_setopt($ch, CURLOPT_POST,1);
		curl_setopt($ch, CURLOPT_POSTFIELDS, $fields);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
		curl_setopt($ch, CURLOPT_AUTOREFERER, 1);
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
		$result = Q::json_decode(curl_exec($ch), true);
		curl_close($ch);

		if ($error = Q::ifset($result, "error", null)) {
			throw new Exception($error);
		}

		$result["videoId"] = $result["svid"];
		$result["mp4"] = preg_replace("/\/data/", "/videos/video.mp4", $result["url"]);

		return $result;
	}
};