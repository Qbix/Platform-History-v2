#!/usr/bin/env php
<?php

include dirname(__FILE__).'/../Q.inc.php';

$script_name = pathinfo($_SERVER["SCRIPT_NAME"]);
$script = Q_DIR . '/scripts/shards.php';

$realpath = realpath($script);
if (!$realpath) {
	die($header . '[ERROR] ' . "Could not locate $script" . PHP_EOL);
}

include($realpath);