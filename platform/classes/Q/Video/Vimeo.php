<?php
require_once Q_PLUGIN_DIR.'/vendor/autoload.php';
use Vimeo\Vimeo;
use Vimeo\Exceptions\VimeoUploadException;

/**
 * @module Q
 */
/**
 * @class Q_Video_Vimeo
 */
class Q_Video_Vimeo extends Q_Video {

	function __construct () {
		if (!class_exists("Vimeo\Vimeo")) {
			throw new Exception("Vimeo PHP SDK not installed!");
		}
		$clientId = Q_Config::expect("Q", "video", "cloud", "upload", "vimeo", "clientId");
		$clientSecret = Q_Config::expect("Q", "video", "cloud", "upload", "vimeo", "clientSecret");
		$accessToken = Q_Config::expect("Q", "video", "cloud", "upload", "vimeo", "accessToken");
		$this->vimeo = new Vimeo($clientId, $clientSecret, $accessToken);
	}

	/**
	 * Create a video resource on the cloud provider
	 * @method doCreate
	 * @param {array} $params
	 * @throws {Q_Exception_MethodNotSupported|Q_Exception_Upload}
	 * @return {array} the response from the server, may contain errors
	 */
	function doCreate($params = array())
	{
		// Ignore any specified upload approach and size.
		$options = [
			'upload' => [
				'approach' => 'tus',
				'size' => (int)$params['size']
			],
			'name' => Q::ifset($params, 'name', "Untitled"),
			'privacy' => [
				//'download' => false, // need to upgrade vimeo account to PRO
				//'embed' => "whitelist" // need to upgrade vimeo account to PRO
			]
		];

		// Use JSON filtering so we only receive the data that we need to make an upload happen.
		$uri = '/me/videos?fields=uri,upload';

		$intent = $this->vimeo->request($uri, $options, 'POST');
		if ($intent['status'] !== 200) {
			$intent_error = !empty($intent['body']['error']) ? ' [' . $intent['body']['error'] . ']' : '';
			throw new VimeoUploadException('Unable to initiate an upload.' . $intent_error);
		}

		return $intent;
	}

	/**
	 * Delete video from the cloud provider
	 * @method doDelete
	 * @param {string} $videoId
	 * @throws {Q_Exception_MethodNotSupported|Q_Exception_Upload}
	 * @return {array} the response from the server, may contain errors
	 */
	function doDelete($videoId)
	{
		$intent = $this->vimeo->request('/videos/'.$videoId, [], 'DELETE');
		if ($intent['status'] >= 400) {
			$intent_error = !empty($intent['body']['error']) ? ' [' . $intent['body']['error'] . ']' : '';
			throw new Exception('Unable to delete.' . $intent_error);
		}

		return $intent;
	}

	/**
	 * Get info about video
	 * @method getInfo
	 * @param {string} $videoId
	 * @throws {Q_Exception_MethodNotSupported|Q_Exception_Upload}
	 * @return {array} the response from the server, may contain errors
	 */
	function getInfo($videoId)
	{
		$info = $this->vimeo->request('/videos/'.$videoId);
		if ($info['status'] >= 400) {
			$intent_error = !empty($intent['body']['error']) ? ' [' . $intent['body']['error'] . ']' : '';
			throw new Exception($intent_error);
		}

		return $info['body'];
	}

	/**
	 * Get video thumbnails list by video id
	 * @method getThumbnails
	 * @param {string} $videoId
	 * @throws {Q_Exception_MethodNotSupported|Q_Exception_Upload}
	 * @return {array} the response from the server, may contain errors
	 */
	function getThumbnails($videoId)
	{
		$info = $this->vimeo->request('/videos/'.$videoId.'/pictures');
		if ($info['status'] >= 400) {
			$intent_error = !empty($intent['body']['error']) ? ' [' . $intent['body']['error'] . ']' : '';
			throw new Exception($intent_error);
		}

		return $info['body'];
	}

	/**
	 * Upload file to Vimeo
	 * @method upload
	 * @param {string} $filename Filename of the file to upload
	 * @param {array} [$params] The parameters to send
	 * @throws {Q_Exception_MethodNotSupported|Q_Exception_Upload}
	 * @return {array}
	 */
	function doUpload($filename, $params = array())
	{
        throw new Q_Exception_MethodNotSupported(); // make clients upload, for now
        // otherwise Q_Utils::request() with method: PATCH from PHP etc.
        // followed by method: HEAD to verify it,
        // if we ever wanted to upload a file from server to Vimeo
	}

	/**
	 * Actions need to do when video processed
	 * @method processed
	 * @param {Streams_Stream} $stream Streams/video stream
	 */
	function processed($stream)
	{

	}
};