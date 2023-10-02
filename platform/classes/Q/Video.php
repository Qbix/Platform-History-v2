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
	 * @param {array} $params
	 * @throws {Q_Exception_Upload} if something went wrong
	 * @return {array} the response from the provider
	 */
	function create(array $params = array());

	/**
	 * Upload file to cloud provider
	 * @method upload
	 * @static
	 * @param {string} $filename Filename of the file to upload
	 * @param {array} [$params] The parameters to send
     * @throws {Q_Exception_Upload} if something went wrong
	 * @return {array} the response from the provider
	 */
    function upload($filename, array $params = array());

    /**
	 * Upload file to cloud provider to initiate a conversion job.
     * A webhook should be implemented for when the job is done.
	 * @method convert
	 * @static
	 * @param {string} $src Can be URL or local path
	 * @param {array} [$params] Array with additional params
     * @throws {Q_Exception_Upload} if something went wrong
	 * @return {array} the response from the provider
	 */
    function convert($filename, array $params = array());
		
}

/**
 * Abstract class for database connection
 * @class Q_Video
 * @static
 */

abstract class Q_Video implements Q_Video_Interface {
    function create(array $params = array()) {}
    function upload($filename, array $params = array()) {}
    function convert($filename, array $params = array()) {}
}