#!/usr/bin/env php
<?php

require dirname(__FILE__).'/../Q.inc.php';

$script = CALENDARS_PLUGIN_SCRIPTS_DIR . DS . basename(__FILE__);

$realpath = realpath($script);
if (!$realpath) {
	die($header . '[ERROR] ' . "Could not locate $script" . PHP_EOL);
}

include($realpath);