<?php
if (!defined('RUNNING_FROM_APP') or !defined('CONFIGURE_ORIGINAL_APP_NAME')) {
	die("This script can only be run from an app template.\n");
}

#Arguments
$argv = $_SERVER['argv'];

#Usage strings
$usage = "Usage: php {$argv[0]} " . "[<original_app_name>] <desired_app_name>\n";

$help = <<<EOT
This script automatically does the proper steps to configure an app template into an app that you name.
Run it before running install.php.

Options:

-v --verbose     Print more diagnostic information while working

EOT;

// get all CLI options
$opts = array( 'v::' );
$longopts = array('verbose::');
$options = getopt(implode('', $opts), $longopts);
if (isset($options['help'])) {
	die($help);
}

$verbose = isset($options['verbose']) || isset($options['v']);
$params = array();
foreach ($argv as $k => $v) {
	if (substr($v, 0, 01) !== '-') {
		$params[] = $v;
	}
}

#Check primary arguments count: 1 if running /app/scripts/Q/configure.php
$count = count($params);
if ($count < 2)
	die($usage);

#Read primary arguments
$LOCAL_DIR = APP_DIR;

if ($count > 2) {
	$AppName = $params[1];
	$Desired = $params[2];
} else {
	$AppName = CONFIGURE_ORIGINAL_APP_NAME;
	$Desired = $params[1];
}
$APPNAME = strtoupper($AppName);
$appname = strtolower($AppName);
$DESIRED = strtoupper($Desired);
$desired = strtolower($Desired);
$is_win = (substr(strtolower(PHP_OS), 0, 3) === 'win');

$appRootDir = Q::startsWith(APP_DIR, APP_WEB_DIR) ? APP_WEB_DIR : APP_DIR;

do {
	$go_again = false;
	$iteratorDir = new RecursiveDirectoryIterator(
		$appRootDir, 
		RecursiveDirectoryIterator::SKIP_DOTS
	);
	$iterator = new RecursiveIteratorIterator(
		$iteratorDir,
		RecursiveIteratorIterator::SELF_FIRST
	);
	foreach ($iterator as $filename => $splFileInfo) {
		$pi = pathinfo($filename);
		$pif = $pi['filename'];
		if ($pif === $AppName) {
			$pif = $Desired;
		}
		$parts = explode(DS, $filename);
		foreach ($parts as $p) {
			if (substr($p, 0, 1) === '.') {
				$b = basename($filename);
				if (!in_array($b, array(
					'.hgignore', '.gitignore', '.htaccess'
				))) {
					continue 2;
				}
			}
		}
		// fixed / to DIRECTORY_SEPARATOR
		$filename2 = $pi['dirname'] . DIRECTORY_SEPARATOR . $pif
			. (empty($pi['extension']) ? '' : '.' . $pi['extension']);
		if ($filename != $filename2) {
			if (file_exists($filename2)) {
				echo Q_Utils::colored("Cannot overwrite existing path $filename2", 'red') . PHP_EOL;
			} else {
				if ($verbose) {
					echo Q_Utils::colored($filename . PHP_EOL . "=> $filename2", 'blue').PHP_EOL;
				}
				rename($filename, $filename2);
				$go_again = true;
				break;
			}
		}
		usleep(1); // garbage collection
	}
} while($go_again);

$maxFileSize = min(pow(2, 20), Q_Utils::memoryLimit()/2);
if ($Desired !== CONFIGURE_ORIGINAL_APP_NAME) {
	$it = new RecursiveDirectoryIterator($appRootDir, RecursiveDirectoryIterator::SKIP_DOTS);
	foreach(new RecursiveIteratorIterator($it) as $filename => $splFileInfo) {
		if (is_dir($filename) or is_link($filename)
		or $filename === APP_SCRIPTS_DIR . DS . 'Q' . DS . 'configure.php') {
			continue;
		}
		$extension = pathinfo($filename, PATHINFO_EXTENSION);
		if (!in_array(strtolower($extension), array(
			'php', 'js', 'json',
			'txt', 'log', 'handlebars',
			'html', 'css', 'hgignore', 'gitignore', 'htaccess'
		))) {
			continue;
		}
		if (filesize($filename) > $maxFileSize) {
			if ($verbose) {
				echo Q_Utils::colored("Skipped because file is too large: " . $filename, 'light_gray') . PHP_EOL;
			}
			continue;
		}
		$contents = file_get_contents($filename);
		$contents = preg_replace("/$APPNAME/", $DESIRED, $contents);
		$contents = preg_replace("/$AppName/", $Desired, $contents);
		$contents = preg_replace("/$appname/", $desired, $contents);
		file_put_contents($filename, $contents);
		if ($verbose) {
			echo Q_Utils::colored($filename, 'purple').PHP_EOL;
		}
		usleep(1); // garbage collection
	}
}

echo "Application configured. The next steps are:
1) edit the config in $basename/local/app.json
2) run $basename/scripts/Q/install.php --all
";
