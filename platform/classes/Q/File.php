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
	 * @param {string} [$params.path="uploads"] parent path under web dir (see subpath)
	 * @param {string} [$params.subpath=""] subpath that should follow the path, to save the image under
	 * @param {string} [$params.name] override the name of the file, after the subpath
	 * @param {string} [$params.skipAccess=false] if true, skips the check for authorization to write files there
	 * @return {array} Returns array containing ($name => $tailUrl) pair
	 */
	static function save($params)
	{
		if (empty($params['data'])) {
			throw new Q_Exception(array('field' => 'file'), 'data');
		}
		
		// check whether we can write to this path, and create dirs if needed
		$data = $params['data'];
		$path = isset($params['path']) ? $params['path'] : 'uploads';
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

		/**
		 * @event Q/file/save {after}
		 * @param {string} user
		 * @param {string} path
		 * @param {string} subpath
		 * @param {string} name
		 * @param {string} writePath
		 * @param {string} data
		 * @param {string} tailUrl
		 * @param {integer} size
		 * @param {boolean} skipAccess
		 */
		Q::event(
			'Q/file/save', 
			compact('path', 'subpath', 'name', 'writePath', 'data', 'tailUrl', 'size', 'skipAccess'),
			'after'
		);
		return array($name => $tailUrl);
	}
}