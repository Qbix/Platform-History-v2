#!/usr/bin/env php
<?php

define("CONFIGURE_ORIGINAL_APP_NAME", "MyApp");

include dirname(__FILE__).'/../Q.inc.php';

$script = Q_DIR . '/scripts/translate.php';
$realpath = realpath($script);
if (!file_exists($realpath)) {
	$basename = basename(APP_DIR);
	die($header . '[ERROR] ' . "Could not locate $script");
}

include($realpath);