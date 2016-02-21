<?php

/**
 * @module Q
 */
class Q_Exception_Upload extends Q_Exception
{
	/**
	 * @class Q_Exception_Upload
	 * @constructor
	 * @extends Q_Exception
	 * @param {array} [$param=array()]
	 * @param {array} [$input_fields=array()]
	 */
	function __construct($params = array(), $input_fields = array())
	{
		parent::__construct($params, $input_fields);
		if (!isset($params['code'])) {
			return;
		}
		switch ($params['code']) {
		case UPLOAD_ERR_INI_SIZE:
			$this->message = "the uploaded file exceeds the upload_max_filesize directive in php.ini.";
			break;
		case UPLOAD_ERR_FORM_SIZE:
			$this->message = "value: 2; The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form.";
			break;
		case UPLOAD_ERR_PARTIAL:
			$this->message = "value: 3; The uploaded file was only partially uploaded.";
			break;
		case UPLOAD_ERR_NO_FILE:
			$this->message = "value: 4; No file was uploaded.";
			break;
		case UPLOAD_ERR_NO_TMP_DIR:
			$this->message = "value: 6; Missing a temporary folder. Introduced in PHP 4.3.10 and PHP 5.0.3.";
			break;
		case UPLOAD_ERR_CANT_WRITE:
			$this->message = "value: 7; Failed to write file to disk. Introduced in PHP 5.1.0.";
			break;
		case UPLOAD_ERR_EXTENSION:
			$this->message = "a PHP extension stopped the file upload.";
			break;
		}
	}
}

Q_Exception::add('Q_Exception_Upload', 'upload error');
