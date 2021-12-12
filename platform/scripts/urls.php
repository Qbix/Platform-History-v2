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

$longopts = array('integrity');
$options = getopt('i', $longopts);
if (isset($options['help'])) {
	echo $help;
	exit;
}

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

$ignore = array('php');
$filter = array(
	"/.*\.(?!php)/"
	// "/.*\.json/", "/.*\.js/", "/.*\.css/", "/.*\.md/",
	// "/.*\.gif/", "/.*\.png/", "/.*\.jpg/", "/.*\.jpeg/", "/.*\.ico/",
	// "/.*\.ogg/", "/.*\.mp3/", "/.*\.mp4/",
	// "/.*\.html/", "/.*\.javascript/"
);
$array = array();
Q_script_urls_glob(APP_WEB_DIR, $ignore, 'sha256', null, $result);
$dir_to_save = APP_CONFIG_DIR.DS.'Q';
$parent_dir = $dir_to_save.DS.'urls';
$urls_dir = $parent_dir.DS.'urls';
$trees_dir = $parent_dir.DS.'trees';
$diffs_dir = $parent_dir.DS.'diffs';
foreach (array($dir_to_save, $parent_dir, $urls_dir, $diffs_dir) as $dir) {
	if (!file_exists($dir)) {
		mkdir($dir);
	}
}
if (is_dir($parent_dir)) {
	$web_urls_path = APP_WEB_DIR.DS.'Q'.DS.'urls';
	if (!file_exists($web_urls_path)) {
		Q_Utils::symlink($parent_dir, $web_urls_path);
	}
}
$time = time();
$urls_export = Q::var_export($result);
file_put_contents(
	$dir_to_save.DS.'urls.php',
	"<?php\nQ_Uri::\$urls = $urls_export;"
);
echo PHP_EOL;
file_put_contents($urls_dir.DS."$time.json", Q::json_encode($result));
$result['#timestamp'] = $time;
file_put_contents($urls_dir.DS."latest.json", Q::json_encode($result));
$tree = new Q_Tree($result);
//file_put_contents($arrays_dir.DS."$time.json", Q::json_encode($array));
$diffs = Q_script_urls_diffs($tree, $urls_dir, $diffs_dir, $time);
echo PHP_EOL;

function Q_script_urls_glob(
	$dir, 
	$ignore = null,
	$algo = 'sha256',
	$len = null,
	&$result = null,
	$levels = 0
) {
	if ($options['i'] or $options['integrity']) {
		$calculateHashes = true;
	} else if ($environment = Q_Config::get('Q', 'environment', '')) {
		$calculateHashes = Q_Config::get(
			'Q', 'environments', $environment, 'urls', 'integrity', false
		);
	} else {
		$calculateHashes = false;
	}

	static $n = 0, $i = 0;
	if (!isset($result)) {
		$result = array();
		$len = strlen($dir);
	}
	$tree = new Q_Tree($result);
	$filenames = glob($dir.DS.'*');
	foreach ($filenames as $f) {
		$u = substr($f, $len+1);
		$v = str_replace(DS, '/', $u);
		$ignore = Q_Config::get('Q', 'urls', 'skip', array());
		if (in_array($v, $ignore)) {
			continue;
		}
		$ext = pathinfo($u, PATHINFO_EXTENSION);
		if (!is_dir($f)) {
			if (is_array($ignore) and in_array($ext, $ignore)) {
				continue;
			}
			if (filesize($f) > Q_Config::get(
				'Q', 'urls', 'script', 'maxFilesize', pow(2, 20)*10
			)) { // file is too big to process
				continue;
			}
			if ($calculateHashes) {
				$c = file_get_contents($f);
				$hash = hash($algo, $c);
				$enchash = base64_encode(hex2bin($hash));
				$value = array('t' => filemtime($f), 'h' => $enchash);
			} else {
				$value = array('t' => filemtime($f));
			}
			$parts = explode(DS, $u);
			$parts[] = $value;
			call_user_func_array(array($tree, 'set'), $parts);
		}
		++$n;
		$is_link = is_link($f) ? 1 : 0;
		// do depth first search, following symlinks two levels down
		if ($levels <= 2 or !$is_link) {
			Q_script_urls_glob($f, $ignore, $algo, $len, $result, $levels + $is_link);
		}
		++$i;
		echo "\033[100D";
		echo "Processed $i of $n files                 ";
		usleep(1); // garbage collection
	}
	return $result;
}

function Q_script_urls_diffs($tree, $urls_dir, $diffs_dir, $time)
{
	$i = 0;
	$filenames = glob($urls_dir.DS.'*');
	$n = count($filenames)-1;
	foreach ($filenames as $g) {
		$b = basename($g);
		if ($b === 'latest.json') {
			continue;
		}
		$t = new Q_Tree();
		$t->load($g);
		$diff = $t->diff($tree, true);
		$diff->set('#timestamp', $time);
		$diff->save($diffs_dir.DS.$b);
//		$tree = new Tree();
//		$tree->load($g);
//		$diff = $tree->diff()
//		$tree = new Q_Tree($diff);
//		$c = file_get_contents($g);
//		if (!$c) continue;
//		$arr = Q::json_decode($c, true);
//		foreach ($arr as $k => $v) {
//			$v2 = Q::ifset($array, $k, null);
//			if ($k and $v != $v2) {
//				$parts = explode('/', $k);
//				$parts[] = $v;
//				var_dump($k);
//				call_user_func_array(array($tree, 'set'), $parts);
//			}
//		}
		++$i;
		echo "\033[100D";
		echo "Generated $i of $n diff files    ";
		//file_put_contents(, Q::json_encode($diff));
	}
}