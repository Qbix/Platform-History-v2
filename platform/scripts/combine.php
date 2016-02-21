<?php
$FROM_APP = defined('RUNNING_FROM_APP'); //Are we running from app or framework?

#Arguments
$argv = $_SERVER['argv'];
$count = count($argv);

#Usage strings
$usage = "Usage: php {$argv[0]} " . ($FROM_APP ? '' : '<app_root> ');

if(!$FROM_APP)
	$usage.=PHP_EOL.PHP_EOL.'<app_root> must be a path to the application root directory';

$usage = <<<EOT
$usage

EOT;

$help = <<<EOT
Script to combine static files into some target static files, and run them through filters

1) Check config information for current environment
2) Generate combined files and run them through filters

$usage

EOT;

#Is it a call for help?
if (isset($argv[1]) and $argv[1] == '-help')
	die($help);

#Check primary arguments count: 1 if running /app/scripts/Q/urls.php, 2 if running /framework/scripts/app.php
if ($count < 1 or !$FROM_APP)
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
include($Q_filename);

echo Q_scripts_combine() . PHP_EOL;

function Q_scripts_combine()
{
	$environment = Q_Config::get('Q', 'environment', false);
	if (!$environment) {
		return "Config field 'Q'/'environment' is empty";
	}
	$files = Q_Config::get('Q', 'environments', $environment, 'files', 
		Q_Config::get('Q', 'environments', '*', 'files', false)
	);
	if (empty($files)) {
		return "Config field 'Q'/'environments'/'$environment'/files is empty";
	}
	$filters = Q_Config::get('Q', 'environments', $environment, 'filters', 
		Q_Config::get('Q', 'environments', '*', 'filters', false)
	);
	if (empty($filters)) {
		return "Config field 'Q'/'environments'/'$environment'/filters is empty";
	}
	$combined = array();
	foreach ($files as $src => $dest) {
		$f = Q_Uri::filenameFromUrl(Q_Html::themedUrl($src, true));
		if (!file_exists($f)) {
			return "Aborting: File corresponding to $src doesn't exist";
		}
		$content = file_get_contents($f);
		$combined[$dest][$src] = $content;
	}
	foreach ($combined as $dest => $parts) {
		$df = Q_Uri::filenameFromUrl(Q_Html::themedUrl($dest));
		$ext = pathinfo($df, PATHINFO_EXTENSION);
		echo "Writing $df\n";
		if (!empty($filters)) {
			foreach ($filters as $e => $filter) {
				if ($ext !== $e) continue;
				$p = !empty($filter['params']) ? Q::json_encode($filter['params']) : '';
				echo "\t".$filter['handler']."$p\n";
				foreach ($parts as $src => $part) {
					echo "\t\t$src\n";
				}
				$params = compact('dest', 'parts');
				if (!empty($filter['params'])) {
					$params = array_merge($params, $filter['params']);
				}
				$content = Q::event($filter['handler'], $params);
			}
		}
		file_put_contents($df, $content);
	}
	echo "Success.";
}