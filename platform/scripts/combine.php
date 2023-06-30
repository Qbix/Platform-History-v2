<?php
$FROM_APP = defined('RUNNING_FROM_APP'); // Are we running from app or framework?

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

Options

--all            Processes all extensions, this is the default
--css            Process .css files instead of all
--js             Process .js files instead of all
--process <ext>  Followed by names a custom extension to process

EOT;

#Is it a call for help?
if (isset($argv[1]) and in_array($argv[1], array('--help', '/?', '-h', '-?', '/h')))
	die($help);

#Check primary arguments count: 1 if running /app/scripts/Q/combine.php
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
$opts = 'afcj';
$longopts = array('all', 'process:', 'css', 'js');
$options = getopt($opts, $longopts);
if (isset($options['help'])) {
	echo $help;
	exit;
}

$process = $options;
if (empty($process)) {
	$process['all'] = false; // process all extensions
} else if (!empty($p = $options['process'])) {
	if (is_string($p)) {
		$p = array($p);
	}
	foreach ($p as $ext) {
		$process[$ext] = false; // process this extension
	}
}

$src = $dest = null;
$combined = array();
$preload = array();
$dir_to_save = APP_CONFIG_DIR.DS.'Q';
if (!file_exists($dir_to_save)) {
	mkdir($dir_to_save);
}
$baseUrl = Q_Request::baseUrl();
echo Q_combine($process) . PHP_EOL;

function Q_combine($process)
{
	global $combined, $src, $dest, $baseUrl; // used inside called function
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
	foreach ($files as $src => $dest) {
		$df = Q_Uri::filenameFromUrl(Q_Html::themedUrl($dest));
		if (!Q_Valid::url($src) or Q::startsWith($src, $baseUrl)) {
			$ext = strtolower(pathinfo($src, PATHINFO_EXTENSION));
			if (!isset($process[$ext]) and !isset($process['all'])) {
				continue;
			}
			$f = Q_Uri::filenameFromUrl(Q_Html::themedUrl($src, array(
				'ignoreEnvironment' => true
			)));
			if ($f === $df) {
				echo "Recursion encountered:\n$src => $dest" . PHP_EOL;
				exit;
			}
			if (!file_exists($f)) {
				return "Aborting: File $f corresponding to $src doesn't exist";
			}
			$content = file_get_contents($f);
		} else {
			echo "Downloading: $src" . PHP_EOL;
			$content = file_get_contents($src);
		}
		$combined[$dest][$src] = $content;
	}
	foreach ($combined as $dest => $parts) {
		$df = Q_Uri::filenameFromUrl(Q_Html::themedUrl($dest));
		$ext = strtolower(pathinfo($df, PATHINFO_EXTENSION));
		echo "Writing $df\n";
		if (!empty($filters)) {
			foreach ($filters as $e => $filter) {
				if (!isset($process[$e]) and !isset($process['all'])) {
					continue;
				}
				if ($ext !== $e) {
					continue;
				}
				$p = !empty($filter['params']) ? Q::json_encode($filter['params']) : '';
				echo "\t".$filter['handler']."$p\n";
				foreach ($parts as $src => $part) {
					echo "\t\t$src\n";
				}
				$printProgress = true;
				$params = @compact('dest', 'parts', 'ext', 'printProgress');
				if (!empty($filter['params'])) {
					$params = array_merge($params, $filter['params']);
				}
				if ($ext === 'css') {
					Q_combine_preprocessCss($params);
				}
				$content = Q::event($filter['handler'], $params);
			}
		}
		file_put_contents($df, $content);
		usleep(1); // garbage collection
	}
	echo "Success.";
}

function Q_combine_preprocessCss(&$params)
{
	global $preload, $dir_to_save;
	$dest = $params['dest'];
	$parts = $params['parts'];
	$processed = array();
	foreach ($parts as $src => $content) {
		if (strpos($src, '{{') === 0) {
			$src = Q_Request::tail(Q_Uri::interpolateUrl($src), true);
		}
		$content = preg_replace_callback(
			"/url\(\'{0,1}(.*)\'{0,1}\)/",
			'Q_combine_preload',
			$content
		);
		$processed[$src] = $content;
		if (Q_Valid::url($src) and !Q::startsWith($src, $baseUrl)) {
			continue;
		}
		$dest_parts = explode('/', $dest);
		$src_parts = explode('/', $src);
		$j = 0;
		foreach ($dest_parts as $i => $p) {
			if (!isset($src_parts[$i]) or $src_parts[$i] !== $dest_parts[$i]) {
				break;
			}
			$j = $i+1;
		}
		$dc = count($dest_parts);
		$sc = count($src_parts);
		$relative = str_repeat("../", $dc-$j-1)
			. implode('/', array_slice($src_parts, $j, $sc-$j-1));
		if ($relative) {
			$relative .= '/';
		}
		$content = preg_replace(
			"/url\((\'){0,1}(?!http\:\/\/|https\:\/\/)/",
			'url($1'.$relative,
			$content
		);
		$processed[$src] = $content;
	}
	$params['processed'] = $processed;
	
	$preload_export = Q::var_export($preload, true);
	file_put_contents(
		$dir_to_save.DS.'preload.php',
		"<?php\nQ_Uri::\$preload = $preload_export;"
	);
}

function Q_combine_preload($matches)
{
	global $combined, $src, $dest, $preload, $baseUrl;
	$url = $matches[1];
	if (strpos($url, '{{') === 0) {
		$url = Q_Request::tail(Q_Uri::interpolateUrl($url), true);
	}
	if (!Q_Valid::url($url) or Q::startsWith($url, $baseUrl)) {
		return $matches[0];
	}
	$f = Q_Uri::filenameFromUrl(Q_Html::themedUrl($dest, array(
		'ignoreEnvironment' => true
	)));
	$info = pathinfo($f);
	$dirname = $info['dirname'] . DS . $info['filename'];
	@mkdir($dirname);
	$info = parse_url($url);
	$path = $info['path'];
	$parts = explode('.', $path);
	$ext = array_pop($parts);
	$path2 = implode('.', $parts);
	$basename = Q_Utils::normalize($path2) . ".$ext";
	$contents = $combined[$dest][$src];
	$filename = $dirname . DS . $basename;
	file_put_contents($filename, $contents);
	echo "\t Saving $basename\n";
	$preloadUrl = substr($dirname, strlen(APP_WEB_DIR)+1) . '/'
		. str_replace(DS, '/', $basename);
	$preload[$dest][] = $preloadUrl;
	return $filename;
}