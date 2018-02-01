<?php
if (!defined('RUNNING_FROM_APP') or !defined('CONFIGURE_ORIGINAL_APP_NAME')) {
	die("This script can only be run from an app template.\n");
}

Q_Cache::clear(true, false, 'Q_Text::get');

$translate = new Q_Translate();