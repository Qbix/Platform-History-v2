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

EOT;

$help = <<<EOT
Script to generate application models.

$usage

EOT;

#Is it a call for help?
if (isset($argv[1]) and in_array($argv[1], array('--help', '/?', '-h', '-?', '/h')))
	die($help);

$connections = array_keys(Q_Config::get('Db', 'connections', array()));
$plugins = Q::plugins();

if (!isset($argv[1]) or $argv[1] != '--all')
	$connections = array_diff($connections, $plugins);

foreach($connections as $c) {
	if ($c === '*') continue;
	$isPlugin = in_array($c, $plugins);
	echo "\nMaking models for ".($isPlugin ? "plugin" : "connection")." $c\n";
	$path = ($isPlugin ? Q_DIR.DS.'plugins'.DS.$c : APP_DIR).DS.'classes';
	if ($filenames = Db::connect($c)->generateModels($path)) {
		echo "Files saved:\n\t".implode("\n\t", $filenames);
	}
	echo "\n";
}
echo "\nSuccess\n";

