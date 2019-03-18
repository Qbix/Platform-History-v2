<?php

/**
 * Handle different tasks related to Q config
 */

function Q_Config_post () {
	switch (isset($_REQUEST['Q/method']) ? $_REQUEST['Q/method'] : null) {
		case 'clear':
			if (!isset($_REQUEST['filename']))
				throw new Q_Exception("'filename' is not defined in 'clear', 'Q/config' handler");
			else $filename = $_REQUEST['filename'];
			if (!isset($_REQUEST['args']))
				throw new Q_Exception("'args' is not defined in 'clear', 'Q/config' handler");
			else $args = $_REQUEST['args'];
			if (!isset($_REQUEST['noSave']))
				throw new Q_Exception("'noSave' is not defined in 'clear', 'Q/config' handler");
			else $noSave = $_REQUEST['noSave'];
			Q_Config::$cache = Q_Config::clearOnServer($filename, $args, $noSave);
			break;
		case 'set':
			if (!isset($_REQUEST['filename']))
				throw new Q_Exception("'filename' is not defined in 'set', 'Q/config' handler");
			else $filename = $_REQUEST['filename'];
			if (!isset($_REQUEST['data']))
				throw new Q_Exception("'data' is not defined in 'set', 'Q/config' handler");
			else $data = $_REQUEST['data'];
			if (!isset($_REQUEST['clear']))
				throw new Q_Exception("'clear' is not defined in 'set', 'Q/config' handler");
			else $clear = $_REQUEST['clear'];
			Q_Config::$cache = Q_Config::setOnServer($filename, $data, $clear);
			break;
		case 'get':
			if (!isset($_REQUEST['filename']))
				throw new Q_Exception("'filename' is not defined in 'put', 'Q/config' handler");
			else $filename = $_REQUEST['filename'];
			Q_Config::$cache = Q_Config::getFromServer($filename);
			break;
		default:
			throw new Q_Exception("Unknown 'Q/method' in 'Q/config' handler");
			break;
	}
}
