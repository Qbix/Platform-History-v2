<?php
/**
 * @module Q
 */
/**
 * @class Q_Video_Vimeo
 */
class Q_Video_Vimeo extends Q_Video {

	/**
	 * Create a video resource on the cloud provider
	 * @param {array} $params
	 * @throws {Q_Exception_Upload}
	 * @return {array} the response from the server, may contain errors
	 */
	function create($params)
	{
		// TODO: Q_Utils::post() to Vimeo thenreturn results
        // Basically, Streams/video/post.php should have
        // an event, whose handlers would call this method,
        // and then Q_Response::setSlot('create', $result);
        // so the client can get the upload_link to PATCh to
	}

	/**
	 * Upload file to Vimeo
	 * @method upload
	 * @static
	 * @param {string} $filename Filename of the file to upload
	 * @param {array} [$params] The parameters to send
	 * @return {array}
	 */
	function upload($filename, $params = array())
	{
        throw new Q_Exception_Upload(); // make clients upload, for now
        // otherwise Q_Utils::request() with method: PATCH from PHP etc.
        // followed by method: HEAD to verify it,
        // if we ever wanted to upload a file from server to Vimeo
	}
};