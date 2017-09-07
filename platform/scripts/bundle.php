<?php

/**
 * Use this script to generate application models.
 */

$FROM_APP = defined('RUNNING_FROM_APP'); //Are we running from app or framework?
include dirname(__FILE__).DS.'Q.inc.php';

#Arguments
$argv = $_SERVER['argv'];
$count = count($argv);

#Usage strings
$usage = "Usage: php {$argv[0]} <pathToBundleDir>\n";

$help = <<<EOT
Script to bundle the app code in a native application bundle.

$usage

EOT;

$app = Q::app();

#Is it a call for help?
if (isset($argv[1]) and in_array($argv[1], array('--help', '/?', '-h', '-?', '/h')))
	die($help);

#Check primary arguments count: 1 if running /app/scripts/Q/combine.php
if ($count < 1 or !$FROM_APP)
	die($usage);

$dir = $argv[1];
if (empty($dir)) {
	die($usage);
}
if (!is_dir($dir)) {
	die("Destination directory not found: $dir\n");
}

// Set up rsync options
$options = array();
$pluginDirs = glob(APP_WEB_DIR.DS.'Q'.DS.'plugins'.DS.'*');
foreach ($pluginDirs as $pluginDir) {
	$pluginName = basename($pluginDir);
	$options[$pluginName] = '';
	$exclude = Q_Config::get("Q", "bundle", "exclude", $pluginName, array());
	foreach ($exclude as $e) {
		$excludePath = $pluginDir.DS.$e;
		if (!realpath($excludePath)) {
			echo "\n  (Warning: missing $excludePath)\n";
		}
		$options[$pluginName] .= " --exclude=" . escapeshellarg($e);
	}
}
$options[$app] = '';
$exclude = Q_Config::get("Q", "bundle", "exclude", $app, array());
$exclude[] = 'Q/plugins';
foreach ($exclude as $e) {
	$excludePath = "$e";
	if (!realpath(APP_WEB_DIR.DS.$excludePath)) {
		echo "\n  (Warning: missing $excludePath)\n";
	}
	$options[$app] .= " --exclude=" . escapeshellarg($e);
}

// Do the platform rsync
$srcs = glob(APP_WEB_DIR.DS.'Q'.DS.'*');
foreach ($srcs as $src) {
	$basename = basename($src);
	$subsrcs = glob($src.DS.'*');
	foreach ($subsrcs as $subsrc) {
		$basename2 = basename($subsrc);
		$dest = $dir.DS.'Q'.DS.$basename.DS.$basename2;
		$realdest = realpath($dest);
		if (!$realdest or !is_dir($dest)) {
			if (file_exists($dest)) {
				unlink($dest);
			}
			mkdir($dest, 0777, true);
			if (!is_dir($dest)) {
				die ("Could not create $dest\n");
			}
		}
		$realdest = realpath($dest);
		echo "Syncing web/Q/$basename/$basename2...\n";
		$pluginName = $basename2;
		if (glob("$subsrc/*")) {
			exec ("rsync -az --copy-links $options[$pluginName] $subsrc/* $dest\n");
		}
	}
}

// Then do the app rsync
echo "Syncing web...\n";
$src = APP_WEB_DIR;
$dest = $dir;
exec ("rsync -az --copy-links $options[$app] $src/* $dest\n");