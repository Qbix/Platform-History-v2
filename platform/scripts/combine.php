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

$baseUrl = Q_Request::baseUrl();
$environment = Q_Config::expect('Q', 'environment');
$preparedPath = Q_Config::get('Q', 'environments', $environment, 'preparedPath',
	Q_Config::get('Q', 'environments', '*', 'preparedPath', false)
);
$prepared_dir = Q_Uri::filenameFromUrl($baseUrl . "/" . $preparedPath);

$src = $dest = null;
$prepared = array();
$combined = array();
$preload = array();
$dir_to_save = APP_CONFIG_DIR.DS.'Q';
if (!file_exists($dir_to_save)) {
	mkdir($dir_to_save);
}
echo "Scanning and preparing files";
Q_prepare();
echo PHP_EOL;
echo Q_combine($process) . PHP_EOL;

function Q_prepare()
{
	$environment = Q_Config::expect('Q', 'environment');
	$prepare = Q_Config::get('Q', 'environments', $environment, 'prepare',
		Q_Config::get('Q', 'environments', '*', 'prepare', false)
	);
	foreach ($prepare as $prefix => $extensions) {
		if (strpos($prefix, '{{') === 0) {
			$prefix = Q_Request::tail(Q_Uri::interpolateUrl($prefix), true);
		}
		$dir = Q_Html::themedFilename($prefix);
		Q_traverse($dir, $extensions);
	}
}

function Q_traverse($dir, $extensions)
{
	global $prepared, $prepared_dir;
	echo '.';
	$newdir = str_replace(APP_WEB_DIR, $prepared_dir, $dir);
	foreach (scandir($dir) as $basename) {
		if ($basename === '.' || $basename === '..') {
			continue;
		}
		foreach ($extensions as $extension) {
			$parts = explode('.', $basename);
			if (count($parts) <= 1) {
				continue;
			}
			$ext = array_pop($parts);
			if ($ext === $extension
			&& !str_contains($basename, '.min.')) {
				$newname = $newdir . DS . implode('.', $parts) . '.min.' . $ext;
				$prepared[$dir . DS . $basename] = $newname;
				mkdir($newdir, 0755, true);
			}
		}
		$subdir = $dir . DS . $basename;
		if (is_dir($subdir)) {
			Q_traverse($subdir, $extensions);
		}
	}
}

function Q_combine($process)
{
	global $prepared, $combined, $src, $dest, $baseUrl; // used inside called function
	$environment = Q_Config::expect('Q', 'environment');
	$files = Q_Config::get('Q', 'environments', $environment, 'files', 
		Q_Config::get('Q', 'environments', '*', 'files', false)
	);
	$files = array_merge($prepared, $files);
	if (empty($files)) {
		return "Config field 'Q'/'environments'/'$environment'/files is empty";
	}
	$filters = Q_Config::get('Q', 'environments', $environment, 'filters', 
		Q_Config::get('Q', 'environments', '*', 'filters', false)
	);
	if (empty($filters)) {
		return "Config field 'Q'/'environments'/'$environment'/filters is empty";
	}
	$already = array();
	$firstLine = "/**** Qbix: produced by scripts/Q/combine.php";
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
		$hash = sha1($content);
		$previous = file_get_contents($df);
		if ($previous !== false) {
			$pos = strpos($previous, $firstLine . PHP_EOL . "* SHA1: $hash");
			if ($pos !== false) {
				// we already processed this file, just get the result
				$posEnd = strpos($previous, $firstLine, $pos + 1);
				if ($posEnd === false) {
					$posEnd = strlen($previous);
				}
				$already[$src] = substr($previous, $pos, $posEnd - $pos);
			}
		}
		$combined[$dest][$src] = $content;
	}
	foreach ($combined as $dest => $parts) {
		$df = Q_Uri::filenameFromUrl(Q_Html::themedUrl($dest));
		$ext = strtolower(pathinfo($df, PATHINFO_EXTENSION));
		$content = '';
		$info = array();
		$printProgress = true;
		if (!empty($filters)) {
			$params = @compact('dest', 'parts', 'ext', 'printProgress');
			foreach ($already as $k => $v) {
				unset($params['parts'][$k]); // no need to process it
			}
			if (!empty($params['parts'])) {
				foreach ($filters as $e => $filter) {
					if (!isset($process[$e]) and !isset($process['all'])) {
						continue;
					}
					if ($ext !== $e) {
						continue;
					}
					$p = !empty($filter['params']) ? Q::json_encode($filter['params']) : '';
					echo "\t".$filter['handler']."$p\n";
					$p = empty($filter['params'])
						? $params
						: array_merge($params, $filter['params']);
					$p['info'] = &$info;
					if ($ext === 'css') {
						Q_combine_preprocessCss($p);
					}
					Q::event($filter['handler'], $p);
				}
			}
		}
		$time = time();
		$filter = isset($info['filter']) ? $info['filter'] : '';
		foreach ($parts as $src => $v) {
			if (!empty($info['results'][$src])) {
				$hash = sha1($v);
				$filter = $info['filters'][$src];
				$prefix = implode(PHP_EOL, array( 
					$firstLine,
					"* SHA1: $hash", 
					"* SOURCE: $src",
					"* FILTER: $filter",
					"* TIMESTAMP: $time",
					"****/",
					""
				));
				$content .= $prefix . $info['results'][$src] . PHP_EOL . PHP_EOL;
			} else if (!empty($already[$src])) {
				$content .= $already[$src];
			}
		}
		file_put_contents($df, $content);
		echo Q_Utils::colored("Produced $df", 'white', 'green') . PHP_EOL;
		gc_collect_cycles(); // garbage collection
	}
	echo "Success.";
}

function Q_combine_preprocessCss(&$params)
{
	global $preload, $dir_to_save;
	$dest = $params['dest'];
	$parts = $params['parts'];
	$processed = array();
	$baseUrl = Q_Request::baseUrl();
	foreach ($parts as $k => $content) {
		$src = $k;
		if (strpos($src, '{{') === 0) {
			$src = Q_Request::tail(Q_Uri::interpolateUrl($src), true);
		}
		$content = preg_replace_callback(
			"/url\(\'{0,1}(.*)\'{0,1}\)/",
			'Q_combine_preload',
			$content
		);
		$processed[$k] = $content;
		if (Q_Valid::url($src) and !Q::startsWith($src, $baseUrl)) {
			continue;
		}
		$content = Q_Utils::adjustRelativePaths($content, $src, $dest);
		$processed[$k] = $content;
	}
	$params['processed'] = $processed;
	
	// $preload_export = Q::var_export($preload, true);
	// file_put_contents(
	// 	$dir_to_save.DS.'preload.php',
	// 	"<?php\nQ_Uri::\$preload = $preload_export;"
	// );
}

function Q_combine_preload($matches)
{
	global $combined, $src, $dest, $preload, $baseUrl;
	$url = $matches[1];
	if (($url[0] === '"' && substr($url, -1) === '"')
	||  ($url[0] === "'" && substr($url, -1) === "'")) {
		$url = substr($url, 1, -1);
	}
	if (strpos($url, '{{') === 0) {
		$url = Q_Request::tail(Q_Uri::interpolateUrl($url), true);
	}
	if (!Q_Valid::url($url) or Q::startsWith($url, $baseUrl)) {
		return $matches[0];
	}
	$f = Q_Uri::filenameFromUrl(Q_Html::themedUrl($dest, array(
		'ignoreEnvironment' => true
	)));
	$pathinfo = pathinfo($f);
	$dirname = $pathinfo['dirname'] . DS . $pathinfo['filename'];
	@mkdir($dirname);
	$urlinfo = parse_url($url);
	$subdirname = Q_Utils::normalize($urlinfo['host']);
	if (!is_dir($dirname . DS . $subdirname)) {
		mkdir($dirname . DS . $subdirname);
	}
	$path = substr($urlinfo['path'], 1);
	$temp = explode('?', $path);
	$path = reset($temp);
	$parts = explode('.', $path);
	$ext = (count($parts) > 1) ? array_pop($parts) : false;
	$path2 = implode('.', $parts);
	$basename = $subdirname . DS . Q_Utils::normalize($path2);
	if ($ext) {
		$basename .= ".$ext";
	}
	$contents = file_get_contents($url); // $combined[$dest][$src];
	if ($contents !== false) {
		$filename = $dirname . DS . $basename;
		file_put_contents($filename, $contents);
		echo "\t\t-> Saving $basename";
	} else {
		echo "\t\t-> Couldn't download $basename";
		return "url($url)";
	}
	echo PHP_EOL;
	$preloadUrl = substr($dirname, strlen(APP_WEB_DIR)+1) . '/'
		. str_replace(DS, '/', $basename);
	$preload[$dest][] = $preloadUrl;
	return "url($pathinfo[filename]/$basename)";
}