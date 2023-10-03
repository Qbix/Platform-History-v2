<?php
/**
 * @module Q
 */
/**
 * @class Q_Video_Muse
 */
class Q_Video_Muse extends Q_Video {

	/**
	 * Create a video resource on the cloud provider
	 * @method doCreate
	 * @param {array} $params
	 * @throws {Q_Exception_MethodNotSupported|Q_Exception_Upload}
	 * @return {array} the response from the server, may contain errors
	 */
	function doCreate($params = array())
	{
		throw new Q_Exception_MissingFile(array('filename' => 'video'));
	}

	/**
	 * Upload file to muse.ai
	 * @method doUpload
	 * @param {string} $filename Filename of the file to upload
	 * @param {array} [$params] The parameters to send
	 * @throws {Q_Exception_MethodNotSupported|Q_Exception_Upload}
	 * @return {array}
	 */
	function doUpload($filename, $params = array())
	{
		$uploadEndPoint = Q_Config::expect("Q", "video", "cloud", "upload", "muse", "uploadEndPoint");
		$museApiKey = Q_Config::expect("Q", "video", "cloud", "upload", "muse", "key");

		$basename = basename($filename);
		$mimeType = finfo_file(finfo_open(FILEINFO_MIME_TYPE), $filename);
		$cFile = curl_file_create($filename, $mimeType, $basename);
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
		$result["videoUrl"] = Q::ifset($result, "mp4", preg_replace("/\/data$/", "/videos/video.mp4", $result["url"]));

		if (!$result["videoUrl"]) {
			return null;
		}

		return $result;
	}
};