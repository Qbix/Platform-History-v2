<?php

/**
 * @module Q
 */

/**
 * Q File class
 * @class Q_File
 */
class Q_File
{	
	/**
	 * Saves a file, usually sent by the client
	 * @method save
	 * @static
	 * @param {array} $params 
	 * @param {string} [$params.data] the file data
	 * @param {string} [$params.path="Q/uploads"] parent path under web dir (see subpath)
	 * @param {string} [$params.subpath=""] subpath that should follow the path, to save the image under
	 * @param {string} [$params.name] override the name of the file, after the subpath
	 * @param {string} [$params.skipAccess=false] if true, skips the check for authorization to write files there
	 * @param {boolean} [$params.audio] set this to true if the file is an audio file
	 * @return {array} Returns array containing ($name => $tailUrl) pair
	 */
	static function save($params)
	{
		if (empty($params['data'])) {
			throw new Q_Exception(array('field' => 'file'), 'data');
		}
		
		// check whether we can write to this path, and create dirs if needed
		$data = $params['data'];
		$path = isset($params['path'])
			? Q_Uri::interpolateUrl($params['path'])
			: 'Q/uploads';
		$subpath = isset($params['subpath']) ? $params['subpath'] : '';
		$realPath = Q::realPath(APP_WEB_DIR.DS.$path);
		if ($realPath === false) {
			throw new Q_Exception_MissingFile(array(
				'filename' => APP_WEB_DIR.DS.$path
			));
		}
		$name = isset($params['name']) ? $params['name'] : 'file';
		if (!preg_match('/^[\w.-]+$/', $name)) {
			$info = pathinfo($name);
			$name = Q_Utils::normalize($info['filename']) . '.' . $info['extension'];
		}
		// TODO: recognize some extensions maybe
		$writePath = $realPath.($subpath ? DS.$subpath : '');
		$lastChar = substr($writePath, -1);
		if ($lastChar !== DS and $lastChar !== '/') {
			$writePath .= DS;
		}
		$skipAccess = !empty($params['skipAccess']);
		Q_Utils::canWriteToPath($writePath, $skipAccess ? null : true, true);
		file_put_contents($writePath.$name, $data);
		$size = filesize($writePath.$name);

		$tailUrl = $subpath ? "$path/$subpath/$name" : "$path/$name";

		// need to send to Q/file/save after event
		$audio = !empty($params['audio']);

		/**
		 * @event Q/file/save {after}
		 * @param {string} user the user
		 * @param {string} path the path in the url
		 * @param {string} subpath the subpath in the url
		 * @param {string} name the actual name of the file
		 * @param {string} writePath the actual folder where the path is written
		 * @param {string} data the data written to the file
		 * @param {string} tailUrl consists of $path/[$subpath/]$name
		 * @param {integer} size the size of the file that was written
		 * @param {boolean} skipAccess whether we are skipping access checks
		 * @param {boolean} audio whether the file is audio
		 */
		Q::event(
			'Q/file/save', 
			@compact('path', 'subpath', 'name', 'writePath', 'data', 'tailUrl', 'size', 'skipAccess', 'audio'),
			'after'
		);
		return array($name => $tailUrl);
	}
}