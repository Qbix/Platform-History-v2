<?php

function Users_before_Q_Utils_canWriteToPath($params, &$result)
{
	extract($params);
	/**
	 * @var $path
	 * @var $throwIfNotWritable
	 * @var $mkdirIfMissing
	 */

	// The Users plugin requires that a user be logged in before uploading a file,
	// and only in the proper directories.
	$user = Users::loggedInUser($throwIfNotWritable);
	if (!$user) {
		return false;
	}
	$app = Q::app();
	$subpaths = Q_Config::get('Users', 'paths', 'uploads', array(
		'files/{{app}}/uploads/Users/{{userId}}' => true
	));
	$paths = array();
	foreach ($subpaths as $subpath => $can_write) {
		if (!$can_write) continue;
		$subpath = Q::interpolate($subpath, array(
			'userId' => Q_Utils::splitId($user->id),
			'app' => $app
		));
		if ($subpath and ($subpath[0] !== '/' or $subpath[0] !== DS)) {
			$subpath = DS.$subpath;
		}
		$last_char = substr($subpath, -1);
		if ($subpath and $last_char !== '/' and $last_char !== DS) {
			$subpath .= DS;
		}
		$paths[] = APP_DIR.$subpath;
		foreach (Q_Config::get('Q', 'plugins', array()) as $plugin) {
			$c = strtoupper($plugin).'_PLUGIN_DIR';
			if (defined($c)) {
				$paths[] = constant($c).$subpath;
			}
		}
		$paths[] = Q_DIR.$subpath;
	}

	// small patch for Win systems. hard to replace / with DS everywhere.
	Q_Utils::normalizePath($path);
	Q_Utils::normalizePath($paths);

	if (strpos($path, "../") === false
	and strpos($path, "..".DS) === false) {
		foreach ($paths as $p) {
			$len = strlen($p);
			if (strncmp($path, $p, $len) === 0) {
				// we can write to this path
				if ($mkdirIfMissing and !file_exists($path)) {
					$mode = is_integer($mkdirIfMissing)
						? $mkdirIfMissing
						: 0777;
					$mask = umask(Q_Config::get('Q', 'internal', 'umask', 0000));
					if (!@mkdir($path, $mode, true)) {
						throw new Q_Exception_FilePermissions(array(
							'action' => 'create',
							'filename' => $path,
							'recommendation' => ' Please set your files directory to be writable.'
						));
					}
					umask($mask);
					$dir3 = $path;
					do {
						chmod($dir3, $mode);
						$dir3 = dirname($dir3);
					} while ($dir3 and $dir3 != $p and $dir3.DS != $p);
				}
				$result = true;
				return;
			}
		}
	}
	if ($throwIfNotWritable) {
		throw new Q_Exception_CantWriteToPath();
	}
	$result = false;
}
