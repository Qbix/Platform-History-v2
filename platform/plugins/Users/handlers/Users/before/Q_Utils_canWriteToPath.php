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

	// user ids for which have permissions to save files
	// first user is self
	$usersCanHandle = array($user->id);
	// get labels which can manage icons
	if ($labelsCanManage = Q_Config::get("Users", "icon", "canManage", array())) {
		// if founded labels which can manage icons, collect users who can edit logged user
		$usersCanHandle = array_merge($usersCanHandle, array_keys(Users::byRoles($labelsCanManage)));
	}

	// collect also invited users if icon not custom
	$invitedByMe = Users_Contact::select()->where(array(
		"contactUserId" => $user->id,
		"label" => "Streams/invitedMe"
	))->fetchDbRows();
	foreach ($invitedByMe as $invite) {
		if ($invite->userId == $user->id) {
			continue;
		}

		$invitedUser = Users::fetch($invite->userId, false);
		if (empty($invitedUser)) {
			continue;
		}

		if (Users::isCustomIcon($invitedUser->icon, true)) {
			continue;
		}

		$usersCanHandle[] = $invitedUser->id;
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
