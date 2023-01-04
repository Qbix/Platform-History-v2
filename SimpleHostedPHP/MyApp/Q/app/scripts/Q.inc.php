<?php

/**
 * For including Qbix in your scripts
 */

//
// Constants -- you might have to change these
//
if (!defined('APP_DIR')) {
	define ('APP_DIR', realpath(dirname(__FILE__).DIRECTORY_SEPARATOR.'..'));
}
if (!defined('APP_WEB_DIR')) {
	define ('APP_WEB_DIR', realpath(dirname(dirname(APP_DIR))));
}
define("RUNNING_FROM_APP", APP_DIR);

//
// Include Q
//
$basename = basename(APP_DIR);
$header = "This is a Qbix PHP web app...";
if (!is_dir(APP_DIR)) {
	die("$header\nPlease edit $basename/scripts/Q.inc.php and change APP_DIR to point to your app's directory.\n");
}
if (!defined('Q_DIR')) {
	$paths_filename = realpath(implode(DIRECTORY_SEPARATOR, array(
		APP_DIR, 'local', 'paths.json.php'
	)));
	if (!file_exists($paths_filename)) {
		die("$header\nGo to $basename/scripts/Q directory and run php configure.php\n");
	}
	$paths = json_decode(include($paths_filename), true);
	define('Q_DIR', isset($paths['platform']) ? $paths['platform'] : '');
}

$realpath = realpath(Q_DIR.DIRECTORY_SEPARATOR.'Q.php');
if (!$realpath) {
	die("Please edit $basename/local/paths.json to look like " .
		'{"platform": "path/to/Q/platform"}' .
		"then run configure.php again\n");
}
include($realpath);
