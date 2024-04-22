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

	// ids of users for whom can save files, starting with logged-in user
	$usersCanHandle = array($user->id);

	$matches = array();
	$pregNormalizedPath = preg_replace("#\\\+#", "/", $path);
	if (preg_match("#files/$app/uploads/Users/(.*)/icon#", $pregNormalizedPath, $matches)
	and !empty($matches[1])) {
		if ($userIdForIcon = Q_Utils::joinId($matches[1], '/')
		and $userIdForIcon !== $user->id) {
			// check labels which can manage the user's icon
			if ($labels = Q_Config::get("Users", "icon", "canManage", array())
			and Users_Contact::fetch($userIdForIcon, $labels, array(
				'contactUserId' => $user->id,
				'skipAccess' => true
			))) {
				$usersCanHandle[] = $userIdForIcon;
			} else if ($labels = Q_Config::get("Users", "icon", "canSetInitialCustom", array())
			and Users_Contact::fetch($userIdForIcon, $labels, array(
				'contactUserId' => $user->id,
				'skipAccess' => true
			))) {
				$usersCanHandle[] = $userIdForIcon;
			}
		}
	} else if (preg_match("#files/$app/uploads/Users/(.*)/labels/(.*)/#", $pregNormalizedPath, $matches)
	and !empty($matches[1]) and !empty($matches[2])) {
		if ($label = $matches[2]
		and $userIdForIcon = Q_Utils::joinId($matches[1], '/')
		and $userIdForIcon !== $user->id
		and Users::canManageLabels($user->id, $userIdForIcon, $label)) {
			$usersCanHandle[] = $userIdForIcon;
		}
	}

	$paths = array();
	foreach($usersCanHandle as $userId) {
		foreach ($subpaths as $subpath => $can_write) {
			if (!$can_write) continue;
			$subpath = Q::interpolate($subpath, array(
				'userId' => Q_Utils::splitId($userId),
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
			foreach (Q::plugins() as $plugin) {
				$c = strtoupper($plugin).'_PLUGIN_DIR';
				if (defined($c)) {
					$paths[] = constant($c).$subpath;
				}
			}
			$paths[] = Q_DIR.$subpath;
		}
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
						@chmod($dir3, $mode);
						$dir3 = dirname($dir3);
					} while ($dir3 and $dir3 != $p and $dir3.DS != $p);
				}
				$result = true;
				return;
			}
		}
	}
	$result = false;
}
