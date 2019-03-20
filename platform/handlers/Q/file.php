<?php

function Q_file($params)
{
	$filename = Q::ifset($params, 'filename', Q_Request::filename());
	$parts = explode('.', $filename);
	$ext = end($parts);
	$intercept = true;
	switch ($ext) {
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
			header ("Content-type: application/javascript");
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
			break;
	}
	header("HTTP/1.0 404 Not Found");
	readfile($filename);
	return true;
}
