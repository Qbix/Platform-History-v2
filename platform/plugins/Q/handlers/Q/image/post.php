<?php

/**
 * @module Q
 */

/**
 * Used by HTTP clients to upload a new image to the server
 * @class HTTP Q image
 * @method post
 * @param {array} [$params] Parameters that can come from the request
 *   @param {string} [$params.icon.data]  Required if $_FILES is empty. Base64-encoded  data URI - see RFC 2397
 *   @param {string} [$params.icon.path="Q/uploads"] parent path under web dir (see subpath)
 *   @param {string} [$params.icon.subpath=""] subpath that should follow the path, to save the image under
 *   @param {string} [$params.icon.merge=""] path under web dir for an optional image to use as a background
 *   @param {string} [$params.icon.crop] array with keys "x", "y", "w", "h" to crop the original image
 * @param {string} [$params.save='x'] name of config under Q/image/sizes, which
 *  are an array of $size => $basename pairs
 *  where the size is of the format "WxH", and either W or H can be empty.
 *  These are stored in the config for various types of images, 
 *  and you pass the name of the config, so that e.g. clients can't simply
 *  specify their own sizes.
 * @return {array} Information about the saved image
 */
function Q_image_post($params = null)
{
	$p = $params
		? $params
		: Q::take($_REQUEST, array('data', 'path', 'subpath', 'merge', 'crop', 'save'));
	Q_Valid::requireFields(array('path'), $p, true);
	if (!empty($_FILES)) {
		$file = reset($_FILES);
		$tmp = $file['tmp_name'];
		if (empty($p['data'])) {
			$p['data'] = file_get_contents($tmp);
		}
		unlink($tmp);
	} else {
		if (empty($p['data'])) {
			throw new Q_Exception_RequiredField(array('field' => 'data'), 'data');
		}
		$p['data'] = base64_decode(chunk_split(substr($p['data'], strpos($p['data'], ',')+1)));
	}
	$timeLimit = Q_Config::get('Q', 'uploads', 'limits', 'time', 5*60*60);
	set_time_limit($timeLimit); // default is 5 min for saving the image in various formats
	$data = Q_Image::save($p);
	if (empty($params)) {
		Q_Response::setSlot('data', $data);
	}
	return $data;
}
