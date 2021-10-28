#!/usr/bin/env php
<?php

/**
 * Use this script to generate application models.
 */

include dirname(__FILE__).'/../Q.inc.php';

#Arguments
$argv = $_SERVER['argv'];
$count = count($argv);

#Usage strings
$usage = "Usage: php {$argv[0]} " . '[--all|--help]';

$usage = <<<EOT
$usage

Options:

--all Generate also plugins models

--plugin=<plugin name> Generate models for this plugin only. Possible to define multiple plugins: --plugin=<plugin_1> --plugin=<plugin_2> ... 

EOT;

$help = <<<EOT
Script to generate application models.

$usage

EOT;

#Is it a call for help?
if (isset($argv[1]) and in_array($argv[1], array('--help', '/?', '-h', '-?', '/h')))
	die($help);

$longopts = array('plugin:', 'all');
$options = getopt('', $longopts);
$plugins = array();
if (isset($options['plugin'])) {
	$plugins = is_array($options['plugin']) ? $options['plugin'] : array($options['plugin']);
}

// if plugins explicit defined
if (!empty($plugins)) {
	foreach ($plugins as $plugin) {
		createModels($plugin);
	}
	exit;
}

$connections = array_keys(Q_Config::get('Db', 'connections', array()));
$plugins = Q::plugins();

if (!isset($argv[1]) or $argv[1] != '--all') {
	$connections = array_diff($connections, $plugins);
}

foreach($connections as $c) {
	if ($c === '*') {
		continue;
	}

	$isPlugin = in_array($c, $plugins);

	if (!empty($plugins) && !in_array($c, $plugins)) {
		continue;
	}

	createModels($c, $isPlugin);
}
echo "\nSuccess\n";

function createModels($plugin, $isPlugin=true) {
	echo "\nMaking models for ".($isPlugin ? "plugin" : "connection")." $plugin\n";
	$path = ($isPlugin ? Q_DIR.DS.'plugins'.DS.$plugin : APP_DIR).DS.'classes';
	if ($filenames = Db::connect($plugin)->generateModels($path)) {
		echo "Files saved:\n\t".implode("\n\t", $filenames);
	}
	echo "\n";
}