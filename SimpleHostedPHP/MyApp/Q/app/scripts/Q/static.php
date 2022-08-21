#!/usr/bin/env php
<?php

include dirname(__FILE__).'/../Q.inc.php';

$script = Q_DIR . '/scripts/static.php';
$realpath = realpath($script);
if (!file_exists($realpath)) {
	$basename = basename(APP_DIR);
	die($header . '[ERROR] ' . "Could not locate $script");
}

include($realpath);