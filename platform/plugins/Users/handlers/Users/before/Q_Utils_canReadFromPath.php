<?php

function Users_before_Q_Utils_canReadFromPath($params, &$result)
{
	$path = $params['path'];
	/**
	 * @var $path
	 */

	$app = Q::app();
	$subpaths = Q_Config::get('Users', 'paths', 'uploads', array(
		'files/{{app}}/uploads/Users/{{userId}}' => true
	));

	$paths = array();
    foreach ($subpaths as $subpath => $can_write) {
        if (!$can_write) continue;
        $subpath = Q::interpolate($subpath, array(
            'userId' => '',
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

	// small patch for Win systems. hard to replace / with DS everywhere.
	Q_Utils::normalizePath($path);
	Q_Utils::normalizePath($paths);

	if (strpos($path, "../") === false
	and strpos($path, "..".DS) === false) {
		foreach ($paths as $p) {
			$len = strlen($p);
			if (strncmp($path, $p, $len) === 0) {
				// we can read from this path
				$result = true;
				return;
			}
		}
	}
	$result = false;
}
