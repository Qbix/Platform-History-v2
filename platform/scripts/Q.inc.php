<?php

/**
 * Included by framework scripts, not app scripts
 */

//
// Include Q
//
if (!defined('Q_DIR')) {
	define('Q_DIR', dirname(dirname(__FILE__)));
}

try {
	include_once(realpath(Q_DIR.'/Q.php'));
} catch (Exception $e) {
	die('[ERROR] ' . $e->getMessage() . PHP_EOL . $e->getTraceAsString() . PHP_EOL);
}
