<?php

/**
 * @module Q
 */

/**
 * Used by HTTP clients to upload a new file to the server
 * @class HTTP Q file
 * @method post
 * @param {array} [$params] Parameters that can come from the request
 *   @param {string} [$params.data]  Required if $_FILES is empty. Base64-encoded image data URI - see RFC 2397
 *   @param {string} [$params.path="uploads"] parent path under web dir (see subpath)
 *   @param {string} [$params.subpath=""] subpath that should follow the path, to save the image under
 *   @param {string} [$params.name] override the name of the file, after the subpath
 *   @param {boolean} [$params.audio] set this to true if the file is an audio file
 */
function Q_file_post($params = null)
{
	$p = $params
		? $params
		: Q::take($_REQUEST, array('data', 'path', 'subpath', 'audio', 'name'));
	if (!empty($_FILES)) {
		$file = reset($_FILES);
		if ($tmp = $file['tmp_name']) {
			if (empty($p['data'])) {
				$p['data'] = file_get_contents($tmp);
				$p['name'] = $file['name'];
			}
			unlink($tmp);
		}
	} else {
		if (empty($p['data'])) {
			throw new Q_Exception_RequiredField(array('field' => 'data'), 'data');
		}
		$p['data'] = base64_decode(chunk_split(substr($p['data'], strpos($p['data'], ',')+1)));
	}
	$timeLimit = Q_Config::get('Q', 'uploads', 'limits', 'time', 5*60*60);
	set_time_limit($timeLimit); // default is 5 min
	$data = Q_File::save($p);
	if (empty($params)) {
		Q_Response::setSlot('data', $data);
	}
	return $data;
}
