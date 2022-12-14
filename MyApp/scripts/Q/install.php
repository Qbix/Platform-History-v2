#!/usr/bin/env php
<?php

$Q_installing = true;
$Q_Bootstrap_config_plugin_limit = 1;
include dirname(__FILE__).'/../Q.inc.php';

$script_name = pathinfo($_SERVER["SCRIPT_NAME"]);
$script = Q_DIR . '/scripts/app.php';

$realpath = realpath($script);
if (!$realpath) {
	die($header . '[ERROR] ' . "Could not locate $script" . PHP_EOL);
}

include($realpath);
