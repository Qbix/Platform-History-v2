<?php

//
// Constants -- you might have to change these
//
if (!defined('DS'))
	define('DS', DIRECTORY_SEPARATOR);
if (!defined('DOCROOT_DIR'))
	define ('DOCROOT_DIR', dirname(__FILE__));
if (!defined('APP_WEB_DIR'))
	define('APP_WEB_DIR', DOCROOT_DIR);
if (!defined('APP_DIR'))
	define('APP_DIR', DOCROOT_DIR.'Q'.DS.'app');
if (!defined('APP_LOCAL_DIR'))
	define('APP_LOCAL_DIR', APP_DIR.DS.'local');

//
// Include Q
//
$header = "<html><body style='padding: 10px;'><h1>This is a Qbix project...</h1>\n";
$footer = "</body></html>";
if (!is_dir(DOCROOT_DIR)) {
	die("$header\nPlease edit index.php and define DOCROOT_DIR to point to your app's directory.\n$footer");
}

$basename = basename(DOCROOT_DIR);
if (!defined('Q_DIR')) {
	$paths_filename = realpath(implode(APP_LOCAL_DIR.DS.'paths.json.php'));
	if (!file_exists($paths_filename)) {
		die("$header\nGo to $basename/Q/app/scripts/Q directory and run php configure.php\n$footer");
	}
	$json = include($paths_filename);
	$paths = json_decode($json, true);
	define('Q_DIR', isset($paths['platform']) ? $paths['platform'] : '');
}

$Q_filename = realpath(Q_DIR.'/Q.php');
if (!file_exists($Q_filename)) {
	die("Please edit $basename/local/paths.json to look like " .
		'{"platform": "path/to/Q/platform"}' .
		"then run configure.php again\n");
}

include($Q_filename);