<?php

/**
 * The video interface module. Contains basic properties and methods and serves as namespace
 * for more specific sub-classes
 * @module Q
 * @main Q
 */

/**
 * Interface that an adapter must support to extend the Db class.
 * @class Q_Video_Interface
 * @static
 */

interface Q_Video_Interface
{
	/**
	 * Interface class for video cloud provider adapter
	 * @class Q_Video_Interface
	 */

	/**
	 * Create a video resource on the cloud provider
	 * @method doCreate
	 * @param {array} $params
	 * @throws {Q_Exception_MethodNotSupported|Q_Exception_Upload}
	 * @return {array} the response from the provider
	 */
	function doCreate(array $params = array());

	/**
	 * Upload file to cloud provider
	 * @method doUpload
	 * @param {string} $filename Filename of the file to upload
	 * @param {array} [$params] The parameters to send
	 * @throws {Q_Exception_MethodNotSupported|Q_Exception_Upload}
	 * @return {array} the response from the provider
	 */
	function doUpload($filename, array $params = array());

	/**
	 * Upload file to cloud provider to initiate a conversion job.
	 * A webhook should be implemented for when the job is done.
	 * @method doConvert
	 * @param {string} $src Can be URL or local path
	 * @param {array} [$params] Array with additional params
	 * @throws {Q_Exception_MethodNotSupported|Q_Exception_Upload}
	 * @return {array} the response from the provider
	 */
	function doConvert($filename, array $params = array());

	/**
	 * Delete video from provider cloud
	 * @method doDelete
	 * @param {string} $videoId
	 */
	function doDelete($videoId);
}

/**
 * Abstract class for database connection
 * @class Q_Video
 */

class Q_Video implements Q_Video_Interface {
	function __construct($options=[])
	{
		$this->cloudUploads = Q_Config::get("Q", "video", "cloud", "upload", "providers", array())[0];
		$this->provider = Q::ifset($options, 'provider', $this->cloudUploads);
		$this->className = "Q_Video_".ucfirst($this->provider);
		$this->adapter = new $this->className();
	}

	function doCreate(array $params = array()) {
		throw Q_Exception_MethodNotImplemented();
	}
	function doUpload($filename, array $params = array()) {
		throw Q_Exception_MethodNotImplemented();
	}
	function doConvert($filename, array $params = array()) {
		throw Q_Exception_MethodNotImplemented();
	}
	function doDelete($videoId) {
		throw Q_Exception_MethodNotImplemented();
	}

	/**
	 * Upload video to cloud provider for streaming etc.
	 * @method upload
	 * @static
	 * @param {string} $filename
	 * @param {array} [$options]
	 * @param {string} [$options.converter]
	 */
	function upload($filename, $options = array())
	{
		try {
			$result = $this->adapter->doUpload($filename);
		} catch (Exception $e) {
			return false;
		}

		if (!Q::isAssociative($result)) {
			return false;
		}
		$stream = Q::ifset($options, "stream", null);
		if ($stream instanceof Streams_Stream) {
			$stream->setAttribute("provider", $this->provider);
			$stream->setAttribute("videoId", $result["videoId"]);
			$stream->setAttribute("Streams.videoUrl", $result["videoUrl"]);
			$stream->setAttribute("duration", $result["duration"]);
			$stream->setAttribute("width", $result["width"]);
			$stream->setAttribute("height", $result["height"]);
			$stream->setAttribute("Q.file.size", $result["size"]);
			$stream->clearAttribute("Q.file.url");
			$stream->changed();
		}
		return true;
	}

	/**
	 * Convert video to animated GIF, then on success,
	 * webhook will eventually update the stream's icon.
	 * @method convert
	 * @static
	 * @param {string} $filename
	 * @param {array} [$options]
	 * @param {string} [$options.converter]
	 */
	function convert($filename, $options = array())
	{
		$stream = Q::ifset($options, "stream", null);
		$cloudConvert = Q_Config::get("Q", "video", "cloud", "convert", array());
		if ($stream) {
			$cloudConvert = Streams_Stream::getConfigField($stream->type, array("video", "cloud", "convert"), $cloudConvert);
		}

		$converter = Q::ifset($options, 'converter', array_key_first($cloudConvert));
		if (!$cloudConvert or !$converter) {
			return false;
		}

		$convertOptions = Q_Config::get("Q", "video", "cloud", "convert", $converter, "options", array());
		if ($stream) {
			$convertOptions = Streams_Stream::getConfigField($stream->type, array("video", "cloud", "convert", $converter, "options"), $convertOptions);
		}

		$options = array_merge($options, $convertOptions);

		$className = "Q_Video_".ucfirst($converter);
		try {
			$adapter = new $className($filename);
			$adapter->doConvert($filename, $options);
		} catch (Exception $e) {
			// stream icon will silently remain as-is
			return false;
		}
		return true;
	}

	/**
	 * Actions need to do when video processed
	 * @method processed
	 * @param {Streams_Stream} $stream Streams/video stream
	 */
	function processed($stream)
	{
		try {
			$this->adapter->processed($stream);
		} catch (Exception $e) {
			return false;
		}
	}

	/**
	 * Delete video from provider cloud
	 * @method delete
	 * @param {string} $videoId
	 */
	function delete($videoId)
	{
		try {
			$this->adapter->doDelete($videoId);
		} catch (Exception $e) {
			return false;
		}
	}
}