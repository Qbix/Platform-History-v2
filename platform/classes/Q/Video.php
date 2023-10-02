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
	 * @static
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
	 * @static
	 * @param {string} $src Can be URL or local path
	 * @param {array} [$params] Array with additional params
     * @throws {Q_Exception_MethodNotSupported|Q_Exception_Upload}
	 * @return {array} the response from the provider
	 */
    function doConvert($filename, array $params = array());
		
}

/**
 * Abstract class for database connection
 * @class Q_Video
 */

abstract class Q_Video implements Q_Video_Interface {
    function doCreate(array $params = array()) {
		throw Q_Exception_MethodNotImplemented();
	}
    function doUpload($filename, array $params = array()) {
		throw Q_Exception_MethodNotImplemented();
	}
    function doConvert($filename, array $params = array()) {
		throw Q_Exception_MethodNotImplemented();
	}

	/**
	 * Upload video to cloud provider for streaming etc.
	 * @method upload
	 * @static
	 * @param {Streams_Stream} $stream
	 * @param {string} $filename
	 * @param {array} [$options]
	 * @param {string} [$options.converter]
	 */
	static function upload($stream, $filename, $options = array())
	{
		$uploadedToProvider = false;
		$cloudUpload = Q_Config::get("Q", "video", "cloud", "upload", array());
		$provider = Q::ifset($options, 'provider', array_key_first($cloudUpload));
		if (empty($cloudUpload) or $provider) {
			return false;
		}
		$className = "Q_Video_".ucfirst($provider);
		try {
			$adapter = new $className($filePath);
			$result = $adapter->doUpload($filePath);
		} catch (Exception $e) {
			$result = null;
		}

		if (!Q::isAssociative($result)) {
			return false;
		}
		$stream->setAttribute("provider", $provider);
		$stream->setAttribute("videoId", $result["videoId"]);
		$stream->setAttribute("videoUrl", $result["videoUrl"]);
		$stream->clearAttribute("Q.file.url");
		$stream->changed();
		return true;
	}

	/**
	 * Convert video to animated GIF, then on success,
	 * webhook will eventually update the stream's icon.
	 * @method convert
	 * @static
	 * @param {Streams_Stream} $stream
	 * @param {string} $filename
	 * @param {array} [$options]
	 * @param {string} [$options.converter]
	 */
	static function convert($stream, $filename, $params = array())
	{
		$environment = Q_Config::get("Q", "environment", null);
		$environments = Q_Config::get("Q", "video", "cloud", "environments", array('live'));
		if (!in_array($environment, $environments)) {
			return; // wrong environment, webhooks may not work etc.
		}

		$cloudConvert = Q_Config::get("Q", "video", "cloud", "convert", array());
		$converter = Q::ifset($options, 'converter', array_key_first($cloudConvert));
		if (!$cloudConvert or !$converter) {
			return false;
		}
		$options['tag'] = json_encode(array(
			"publisherId" => $stream->publisherId,
			"streamName" => $stream->name
		));
		$className = "Q_Video_".ucfirst($converter);
		try {
			$adapter = new $className($filePath);
			$adapter->doConvert($filePath, $options);
		} catch (Exception $e) {
			// stream icon will silently remain as-is
			return false;
		}
		return true;
	}
}