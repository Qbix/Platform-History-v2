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

Options include:

--out          Override the output directory, defaults to <app_root>/web
--baseUrl      Override the from Q_Request::baseUrl()

EOT;

$help = <<<EOT
Script to (re)generate static files from Qbix app based on "Q"/"static" config.

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

// get all CLI options
$opts = array('o::');
$longopts = array('out::');
$options = getopt(implode('', $opts), $longopts);
if (isset($options['help'])) {
	echo $help;
	exit;
}
$out = !empty($options['out'])
	? $options['out']
	: Q_Uri::interpolateUrl(Q_Config::get(
		'Q', 'web', 'static', 'dir', APP_WEB_DIR
	), array('web' => APP_WEB_DIR));
$baseUrl = !empty($options['baseUrl']) ? $options['baseUrl'] : Q_Request::baseUrl(true, true);

$config = Q_Config::expect('Q', 'static');
foreach ($config as $suffix => $info) {
	foreach ($info as $route => $value) {
		if (is_string($value)) {
			$combinations = call_user_func(explode('::', $value));
		} else if (is_array($value)) {
			$combinations = Q_Utils::cartesianProduct($value);
		}
		foreach ($combinations as $fields) {
			$url = Q_Uri::url($fields, $route);
			$urlToFetch = Q_Uri::fixUrl("$url?Q.loadExtras=response");
			$body = Q_Utils::get($urlToFetch);
			$filename = $out . DS . Q_Utils::normalizeUrlToPath($url, $suffix, $baseUrl);
			$dirname = dirname($filename);
			if (!file_exists($dirname)) {
				@mkdir($dirname, 0755, true);
				if (!is_dir($dirname)) {
					echo "Couldn't create directory $dirname" . PHP_EOL;
					continue;
				}
			}
			$res = file_put_contents($filename, $body);
			if ($res) {
				echo "Generated $filename" . PHP_EOL;
			} else {
				echo "Couldn't write $filename" . PHP_EOL;
			}
		}
	}
}
