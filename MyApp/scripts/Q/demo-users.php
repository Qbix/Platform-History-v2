#!/usr/bin/env php
<?php

define("CONFIGURE_ORIGINAL_APP_NAME", "UBI");

require_once(dirname(__FILE__).'/../Q.inc.php');
require_once(Q_DIR . DS . implode(DS, array("plugins", "Communities", "scripts", basename(__FILE__))));