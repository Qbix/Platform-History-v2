<?php

/**
 * Use this script to generate application models.
 */

$FROM_APP = defined('RUNNING_FROM_APP'); //Are we running from app or framework?
include dirname(__FILE__).DS.'..'.DS.'Q.inc.php';

#Arguments
$argv = $_SERVER['argv'];
$count = count($argv);

#Usage strings
$usage = "Usage: php {$argv[0]} <pathToBundleDir>";

$help = <<<EOT
Script to bundle the app code in a native application bundle.

$usage

EOT;

#Is it a call for help?
if (isset($argv[1]) and in_array($argv[1], array('--help', '/?', '-h', '-?', '/h')))
	die($help);

#Check primary arguments count: 1 if running /app/scripts/Q/combine.php
if ($count < 1 or !$FROM_APP)
	die($usage);

$dir = $argv[1];
if (!is_dir($dir)) {
	die("Destination directory not found: $dir");
}

#First do the platform rsync
$pluginNames = glob(APP_WEB_DIR.DS.'plugins'.DS.'*');
foreach ($pluginNames as $src) {
	$pluginName = basename($src);
	$pluginsDir = $dir.DS.'plugins';
	$dest = realpath($pluginsDir.DS.$pluginName);
	if (!$dest or !file_exists($dest)) {
		mkdir($dir.DS.$pluginsDir);
	}
	echo "Syncing $pluginName...";
	$exclude = Q_Config::get("Q", "bundle", "exclude", $pluginName, array());
	$options = '';
	foreach ($exclude as $e) {
		$excludePath = realpath("$src/$e");
		if (!$excludePath) {
			echo "\n  (Warning: missing $excludePath)\n";
		}
		$options .= " --exclude=$excludePath";
	}
	exec ("rsync -avz $src/* $dest $options\n");
}