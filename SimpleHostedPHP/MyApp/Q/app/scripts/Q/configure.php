#!/usr/bin/env php
<?php

define('DS', DIRECTORY_SEPARATOR);
define ('APP_DIR', realpath(dirname(dirname(dirname(__FILE__)))));
define ('APP_WEB_DIR', realpath(dirname(dirname(APP_DIR))));
$paths_filename = realpath(implode(DS, array(
	APP_DIR, 'local', 'paths.json.php'
)));
if (!file_exists($paths_filename)) {
	if (!file_exists(APP_DIR . '/local.sample/paths.json.php')) {
		die('[ERROR] Could not locate either local or local.sample folders. Please choose an intact template before running this script.' . PHP_EOL);
	}
	Q_configure_copy(APP_DIR.DS.'local.sample', APP_DIR.DS.'local');
}

define("CONFIGURE_ORIGINAL_APP_NAME", "CoolApp");

include dirname(__FILE__).'/../Q.inc.php';
include Q_SCRIPTS_DIR.DS.'configure.php';

function Q_configure_copy($source, $dest) {
	
	if (file_exists($dest)) {
		if (!is_dir($dest)) {
			throw new Exception(APP_DIR . '/local must be a directory. What happened?');
		}
	} else {
		mkdir($dest);
	}

	foreach (
		$iterator = new RecursiveIteratorIterator(
		new RecursiveDirectoryIterator($source, RecursiveDirectoryIterator::SKIP_DOTS),
		RecursiveIteratorIterator::SELF_FIRST) as $item
	) {
		if ($item->isDir()) {
			mkdir($dest . DIRECTORY_SEPARATOR . $iterator->getSubPathName());
		} else {
			copy($item, $dest . DIRECTORY_SEPARATOR . $iterator->getSubPathName());
		}
	}
	
}
