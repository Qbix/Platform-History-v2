<?php

//
// Constants -- you might have to change these
//
if (!defined('DOCROOT_DIR')) {
	define ('DOCROOT_DIR', dirname(__FILE__));
}

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
	$paths_filename = realpath(implode(DIRECTORY_SEPARATOR, array(
		DOCROOT_DIR, 'Q', 'app', 'local', 'paths.json.php'
	)));
	if (!file_exists($paths_filename)) {
		die("$header\nGo to $basename/Q/app/scripts/Q directory and run php configure.php\n$footer");
	}
	$json = include($paths_filename);
	$paths = json_decode($json, true);
	define('Q_DIR', isset($paths['platform']) ? $paths['platform'] : '');
}

$Q_filename = realpath(Q_DIR.'/Q.php');
if (!file_exists($Q_filename)) {
	die("$header\nPlease edit $basename/local/paths.php and $basename/local/paths.js to indicate the location of the Q/platform directory\n$footer");
}

define('APP_WEB_DIR', APP_DIR);

define('APP_CONFIG_DIR', APP_DIR.DS.'config');
if (!defined('APP_LOCAL_DIR'))
define('APP_LOCAL_DIR', APP_DIR.DS.'local');
if (!defined('APP_CLASSES_DIR'))
define('APP_CLASSES_DIR', APP_DIR.DS.'classes');
if (!defined('APP_FILES_DIR'))
define('APP_FILES_DIR', APP_DIR.DS.'files');
if (!defined('APP_HANDLERS_DIR'))
define('APP_HANDLERS_DIR', APP_DIR.DS.'handlers');
if (!defined('APP_PLUGINS_DIR'))
define('APP_PLUGINS_DIR', APP_DIR.DS.'plugins');
if (!defined('APP_SCRIPTS_DIR'))
define('APP_SCRIPTS_DIR', APP_DIR.DS.'scripts');
if (!defined('APP_TESTS_DIR'))
define('APP_TESTS_DIR', APP_DIR.DS.'tests');
if (!defined('APP_VIEWS_DIR'))
define('APP_VIEWS_DIR', APP_DIR.DS.'views');
if (!defined('APP_TEXT_DIR'))
define('APP_TEXT_DIR', APP_DIR.DS.'text');
if (!defined('APP_WEB_DIR'))
define('APP_WEB_DIR', APP_DIR.DS.'web');
if (!defined('APP_TESTS_DIR'))
define('APP_TESTS_DIR', APP_DIR.DS.'tests');

include($Q_filename);