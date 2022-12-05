<?php

//
// Constants -- you might have to change these
//
if (!defined('APP_DIR')) {
	define ('APP_DIR', dirname(dirname(__FILE__)));
}

//
// Include Q
//
$header = "<html><body style='padding: 10px;'><h1>This is a Qbix project...</h1>\n";
$footer = "</body></html>";
if (!is_dir(APP_DIR)) {
	die("$header\nPlease edit index.php and define APP_DIR to point to your app's directory.\n$footer");
}

$basename = basename(APP_DIR);
if (!defined('Q_DIR')) {
	$paths_filename = realpath(implode(DIRECTORY_SEPARATOR, array(
		APP_DIR, 'local', 'paths.json'
	)));
	if (!file_exists($paths_filename)) {
		die("$header\nGo to $basename/scripts/Q directory and run php configure.php\n$footer");
	}
	$paths = json_decode(file_get_contents($paths_filename), true);
	define('Q_DIR', isset($paths['platform']) ? $paths['platform'] : '');
}

$Q_filename = realpath(Q_DIR.DIRECTORY_SEPARATOR.'Q.php');
if (!file_exists($Q_filename)) {
	die("Please edit $basename/local/paths.json to look like " .
		'{"platform": "path/to/Q/platform"}' .
		" then run configure.php again\n");
}

include($Q_filename);
