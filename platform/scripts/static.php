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
		'Q', 'static', 'dir', APP_WEB_DIR
	), array('web' => APP_WEB_DIR));
$baseUrl = !empty($options['baseUrl']) ? $options['baseUrl'] : Q_Request::baseUrl(true, true);

echo "Generating files into $out" . PHP_EOL . PHP_EOL;
$config = Q_Config::expect('Q', 'static', 'generate');
foreach ($config as $suffix => $info) {
	if (empty($info['routes'])) {
		continue;
	}
	$headers = array();
	if (isset($info['session'])) {
		if (!isset($info['cookies'])) {
			$info['cookies'] = array();
		}
		$sessionName = Q_Config::get('Q', 'session', 'name', 'Q_sessionId');
		$info['cookies'][$sessionName] = is_string($info['session'])
			? $info['session']
			: Q_Session::generateId();
	}
	if (!empty($info['cookies'])) {
		$headers['Cookie'] = http_build_query($info['cookies'], '', '; ');
	}
	$headers['X-Qbix-Request'] = 'static.php';
	if (!empty($info['headers'])) {
		$headers = array_merge($headers, $info['headers']);
	}
	$paramsArray = array();
	$results = array();
	foreach ($info['routes'] as $route => $value) {
		$results = array_merge($results, Q_Uri::urlsFromCombinations($route, $value));
	}
	$c = count($results);
	echo "Requesting $c URLs for suffix $suffix" . PHP_EOL;
	$baseUrlLength = strlen($baseUrl);
	foreach ($results as $url => $info) {
		$urlToFetch = Q_Uri::fixUrl("$url?Q.loadExtras=response");
		$paramsArray[$url] = array('GET', $url, null, null, array(), $headers);
		// $body = Q_Utils::get($urlToFetch, null, array(), $headers);
		$route = $info[1];
		$urlTail = substr($url, $baseUrlLength);
		echo "$route -> $urlTail" . PHP_EOL;
	}
	$bodies = Q_Utils::requestMulti($paramsArray);
	echo PHP_EOL;
	foreach ($bodies as $url => $body) {
		$normalized = Q_Utils::normalizeUrlToPath($url, $suffix, $baseUrl);
		$filename = $out . DS . $normalized;
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
			echo "Generated $normalized" . PHP_EOL;
		} else {
			echo "Couldn't write $normalized" . PHP_EOL;
		}
	}
	echo PHP_EOL;
}
