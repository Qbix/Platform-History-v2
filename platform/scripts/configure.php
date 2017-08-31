<?php
if (!defined('RUNNING_FROM_APP') or !defined('CONFIGURE_ORIGINAL_APP_NAME')) {
	die("This script can only be run from an app template.\n");
}

#Arguments
$argv = $_SERVER['argv'];
$count = count($argv);

#Usage strings
$usage = "Usage: php {$argv[0]} " . "<desired_app_name>\n";

$help = <<<EOT
This script automatically does the proper steps to configure an app template into an app that you name.
Run it before running install.php.

EOT;

#Is it a call for help?
if (isset($argv[1]) and in_array($argv[1], array('--help', '/?', '-h', '-?', '/h')))
	die($help);

#Check primary arguments count: 1 if running /app/scripts/Q/install.php
if ($count < 2)
	die($usage);

#Read primary arguments
$LOCAL_DIR = APP_DIR;

$AppName = CONFIGURE_ORIGINAL_APP_NAME;
$APPNAME = strtoupper($AppName);
$appname = strtolower($AppName);
$Desired = $argv[1];
$DESIRED = strtoupper($Desired);
$desired = strtolower($Desired);
$is_win = (substr(strtolower(PHP_OS), 0, 3) === 'win');

do {
	$go_again = false;
	foreach (
		$iterator = new RecursiveIteratorIterator(
			new RecursiveDirectoryIterator(
				APP_DIR, 
				RecursiveDirectoryIterator::SKIP_DOTS
			),
			RecursiveIteratorIterator::SELF_FIRST
		) as $filename => $splFileInfo
	) {
		$pi = pathinfo($filename);
		$pif = $pi['filename'];
		if ($pif === $AppName) {
			$pif = $Desired;
		}
		// fixed / to DIRECTORY_SEPARATOR
		$filename2 = $pi['dirname'] . DIRECTORY_SEPARATOR . $pif
			. (empty($pi['extension']) ? '' : '.' . $pi['extension']);
		if ($filename != $filename2) {
			if (file_exists($filename2)) {
				throw new Q_Exception("Cannot overwrite existing path $filename2");
			}
			rename($filename, $filename2);
			$go_again = true;
			break;
		}
	}
} while($go_again);

if ($Desired !== CONFIGURE_ORIGINAL_APP_NAME) {
	$it = new RecursiveDirectoryIterator(APP_DIR);
	foreach(new RecursiveIteratorIterator($it) as $filename => $splFileInfo) {
		if (is_dir($filename) or is_link($filename)) continue;
		$contents = file_get_contents($filename);
		$contents = preg_replace("/$APPNAME/", $DESIRED, $contents);
		$contents = preg_replace("/$AppName/", $Desired, $contents);
		$contents = preg_replace("/$appname/", $desired, $contents);
		file_put_contents($filename, $contents);
	}
}

echo "Application configured. The next steps are:
1) edit the config in $basename/local/app.json
2) run $basename/scripts/Q/install.php --all
";
