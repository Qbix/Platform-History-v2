<?php
$FROM_APP = defined('RUNNING_FROM_APP'); //Are we running from app or framework?

#Arguments
$argv = $_SERVER['argv'];
$count = count($argv);

#Usage strings
$usage = "Usage: php {$argv[0]} " . ($FROM_APP ? '' : '<app_root> ');

if(!$FROM_APP) {
	$usage.=PHP_EOL.PHP_EOL.'<app_root> must be a path to the application root directory';
}

$help = <<<EOT
This script create users for each plugin mentioned in config/app.json under Q/plugins

$usage
EOT;

#Is it a call for help?
if (isset($argv[1]) and in_array($argv[1], array('--help', '/?', '-h', '-?', '/h')))
	die($help);

#Check primary arguments count: 1 if running /app/scripts/Q/q11.php, 2 if running /framework/scripts/q11.php
if ($count < ($FROM_APP ? 1 : 2))
	die($usage);

#Read primary arguments
$LOCAL_DIR = $FROM_APP ? APP_DIR : $argv[1];

#Check paths
if (!file_exists($Q_filename = dirname(__FILE__) . DIRECTORY_SEPARATOR . 'Q.inc.php')) #Q Platform
	die("[ERROR] $Q_filename not found" . PHP_EOL);

if (!is_dir($LOCAL_DIR)) #App dir
	die("[ERROR] $LOCAL_DIR doesn't exist or is not a directory" . PHP_EOL);

#Define APP_DIR
if (!defined('APP_DIR'))
	define('APP_DIR', $LOCAL_DIR);

#Include Q
try {
	include($Q_filename);
} catch (Exception $e) {
	die('[ERROR] ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString() . PHP_EOL);
}

$plugins = Q_Config::expect('Q', 'plugins');

foreach($plugins as $plugin) {
	$user = new Users_User();
	$user->id = ucfirst(Q_Utils::normalize(ucwords($plugin), '', null, $user->maxSize_id(), true));

	echo 'Started user ' . $user->id . PHP_EOL;

	// skip if user already exist
	if ($user->retrieve()) {
		echo "\t" . 'user with this id already exist' . PHP_EOL;
		continue;
	}
	$user->username = $plugin;
	$user->icon = "{{baseUrl}}/img/icons/".$user->id;
	$user->signedUpWith = 'none';
	$user->save();
	echo "\t" . 'user created successfully' . PHP_EOL;
}
