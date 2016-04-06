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
Script to update information for cache url rewriting

1) Checks modified times of files in \$app_dir/web, and \$plugin_dir/web for each plugin
2) Caches this information in \$app_dir/config/Q/urls.php, for use during requests

$usage

EOT;

#Is it a call for help?
if (isset($argv[1]) and in_array($argv[1], array('--help', '/?', '-h', '-?', '/h')))
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

$result = Q_script_urls(APP_WEB_DIR);
$dir_to_save = APP_CONFIG_DIR.DS.'Q';
if (!file_exists($dir_to_save)) {
	mkdir($dir_to_save);
}
file_put_contents(
	$dir_to_save.DS.'urls.php',
	"<?php\nQ_Uri::\$urls = " . var_export($result, true) . ";"
);

function Q_script_urls($dir, $len = null, &$result = null, $was_link = false) {
	if (!isset($result)) {
		$result = array();
		$len = strlen($dir);
	}
	$tree = new Q_Tree($result);
	$filenames = glob($dir.DS.'*');
	foreach ($filenames as $f) {
		$u = substr($f, $len);
		if (!empty($result[$u])) {
			continue;
		}
		if (!is_dir($f)) {
			$parts = explode('/', $u);
			$parts[] = filemtime($f);
			call_user_func_array(array($tree, 'set'), $parts);
		}
		$is_link = is_link($f);
		// do depth first search, following symlinks one level down
		if (!$was_link or !$is_link) {
			Q_script_urls($f, $len, $result, $was_link or $is_link);
		}
	}
	return $result;
}