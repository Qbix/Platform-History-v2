<?php

function Q_file($params, &$result)
{
	$filename = Q::ifset($params, 'filename', Q_Request::filename());
	$parts = explode('.', $filename);
	$ext = end($parts);
	switch ($ext) {
		case 'txt': 
			header ("Context-type: text/plain");
			break;
		case 'xml': 
			header ("Context-type: text/$ext");
			break;
		case 'png':
		case 'jpeg':
		case 'gif':
			header ("Content-type: image/$ext");
			break;
		case 'jpg':
			header ("Content-type: image/jpeg");
			break;
		case 'pdf':
			header ("Content-type: application/$ext");
			break;
		case 'js':
			header ("Content-type: text/javascript");
			break;
		case 'ogg':
		case 'mp3':
			header ("Content-type: audio/$ext");
			break;
		case 'flv':
			header ("Content-type: video/x-flv");
			break;
		case 'mp4':
			header ("Content-type: video/$ext");
			break;
		case 'css':
			header ("Content-type: text/css");
			break;
		case 'cur':
			header("Content-type: image/vnd.microsoft.icon .cur .ico");
			break;
		default:
			if (file_exists($filename)) {
				$mimetype = mime_content_type($filename);
				header ("Content-Type: $mimetype");	
			} else {
				header("Content-Type: text/plain");
				$ext = 'txt';
			}
			break;
	}
	if (!file_exists($filename)) {
		Q_Response::code(404);
		Q_Dispatcher::result('404 file generated');
		$filename = Q_PLUGIN_WEB_DIR.DS.'img'.DS.'404'.DS."404.$ext";
		readfile($filename);
		return false;
	}
	if (false === Q::event("Q/file/authorize", compact(
		'filename', 'ext'
	), 'before')) {
		Q_Response::code(404);
		$filename = Q_PLUGIN_WEB_DIR.DS.'img'.DS.'403'.DS."403.$ext";
		readfile($filename);
		return false;
	}
	// if no hooks returned false, then just output the file to the client
	readfile($filename);
	$result = true;
}
