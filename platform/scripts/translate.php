#!/usr/bin/env php
<?php
include(dirname(__FILE__) . DIRECTORY_SEPARATOR . '../Q.inc.php');
include('translate/Translate.php');

Q_Cache::clear(true, false, 'Q_Text::get');

$translate = new Translate();