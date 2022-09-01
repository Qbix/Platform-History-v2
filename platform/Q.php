<?php

/**
 * Qbix Platform
 * by Gregory Magarshak
 *
 * This file should be included by any PHP script that wants
 * to use the Qbix Platform. (For example, a front controller.)
 *
 * @package Q
 */
 
// Enforce PHP version to be > 5.0
if (version_compare(PHP_VERSION, '5.0.0', '<')) {
	die("Q requires PHP version 5.0 or higher. It works even better with PHP 7 and above.");
}

// Was this loaded? In that case, do nothing.
if (defined('Q_VERSION')) {
	return;
}
define('Q_VERSION', '1.1');

//
// Constants
//

if (!defined('DS'))
	define('DS', DIRECTORY_SEPARATOR);
if (!defined('PS'))
	define('PS', PATH_SEPARATOR);

if (!defined('Q_DIR'))
	define('Q_DIR', dirname(__FILE__));
if (!defined('Q_CONFIG_DIR'))
	define('Q_CONFIG_DIR', Q_DIR.DS.'config');
if (!defined('Q_CLASSES_DIR'))
	define('Q_CLASSES_DIR', Q_DIR.DS.'classes');
if (!defined('Q_FILES_DIR'))
	define('Q_FILES_DIR', Q_DIR.DS.'files');
if (!defined('Q_HANDLERS_DIR'))
	define('Q_HANDLERS_DIR', Q_DIR.DS.'handlers');
if (!defined('Q_PLUGINS_DIR'))
	define('Q_PLUGINS_DIR', Q_DIR.DS.'plugins');
if (!defined('Q_SCRIPTS_DIR'))
	define('Q_SCRIPTS_DIR', Q_DIR.DS.'scripts');
if (!defined('Q_TEXT_DIR'))
	define('Q_TEXT_DIR', Q_DIR.DS.'text');	
if (!defined('Q_VIEWS_DIR'))
	define('Q_VIEWS_DIR', Q_DIR.DS.'views');
if (!defined('Q_TESTS_DIR'))
	define('Q_TESTS_DIR', Q_DIR.DS.'tests');	

if (defined('APP_DIR')) {
	if (!defined('APP_CONFIG_DIR'))
		define('APP_CONFIG_DIR', APP_DIR.DS.'config');
	if (!defined('APP_LOCAL_DIR'))
		define('APP_LOCAL_DIR', APP_DIR.DS.'local');
	if (!defined('APP_CLASSES_DIR'))
		define('APP_CLASSES_DIR', APP_DIR.DS.'classes');
	if (!defined('APP_FILES_DIR'))
		define('APP_FILES_DIR', APP_DIR.DS.'files');
	if (!defined('APP_HANDLERS_DIR'))
		define('APP_HANDLERS_DIR', APP_DIR.DS.'handlers');
	if (!defined('APP_PLUGINS_DIR'))
		define('APP_PLUGINS_DIR', APP_DIR.DS.'plugins');
	if (!defined('APP_SCRIPTS_DIR'))
		define('APP_SCRIPTS_DIR', APP_DIR.DS.'scripts');
	if (!defined('APP_TESTS_DIR'))
		define('APP_TESTS_DIR', APP_DIR.DS.'tests');
	if (!defined('APP_VIEWS_DIR'))
		define('APP_VIEWS_DIR', APP_DIR.DS.'views');
	if (!defined('APP_TEXT_DIR'))
		define('APP_TEXT_DIR', APP_DIR.DS.'text');
	if (!defined('APP_WEB_DIR'))
		define('APP_WEB_DIR', APP_DIR.DS.'web');
	if (!defined('APP_TESTS_DIR'))
		define('APP_TESTS_DIR', APP_DIR.DS.'tests');
}

// For backwards compatibility
if (!defined('JSON_UNESCAPED_SLASHES')) define('JSON_UNESCAPED_SLASHES', 0);
if (!defined('JSON_PRETTY_PRINT')) define('JSON_PRETTY_PRINT', 0);

//
// Include core classes
//
require_once(Q_CLASSES_DIR.DS.'Q.php');
require_once(Q_CLASSES_DIR.DS.'Q'.DS.'Cache.php');
require_once(Q_CLASSES_DIR.DS.'Q'.DS.'Bootstrap.php');
require_once(Q_CLASSES_DIR.DS.'Q'.DS.'Tree.php');
require_once(Q_CLASSES_DIR.DS.'Q'.DS.'Config.php');
require_once(Q_CLASSES_DIR.DS.'Q'.DS.'Text.php');
require_once(Q_CLASSES_DIR.DS.'Q'.DS.'Exception.php');
require_once(Q_CLASSES_DIR.DS.'Q'.DS.'Exception'.DS.'PHPError.php');
require_once(Q_CLASSES_DIR.DS.'Q'.DS.'Uri.php');
require_once(Q_CLASSES_DIR.DS.'Db.php');
require_once(Q_CLASSES_DIR.DS.'Db'.DS.'Expression.php');
require_once(Q_CLASSES_DIR.DS.'Db'.DS.'Query.php');
require_once(Q_CLASSES_DIR.DS.'PasswordCompat'.DS.'password.php');
require_once(Q_CLASSES_DIR.DS.'RandomCompat'.DS.'random.php');

//
// Set things up
//

Q::milliseconds();
Q_Bootstrap::registerShutdownFunction();
Q_Bootstrap::setDefaultTimezone();
Q_Bootstrap::setIncludePath();
Q_Bootstrap::defineFunctions();
Q_Bootstrap::registerAutoload();
Q_Bootstrap::registerExceptionHandler();
Q_Bootstrap::registerErrorHandler();
Q_Bootstrap::revertSlashes();
Q_Bootstrap::configure();
Q_Bootstrap::alertAboutLocalConfiguration();
Q_Bootstrap::setDefaultTimezone();
Q_Bootstrap::setResponseBuffered();
Q_Bootstrap::setUrls();
Q_Response::setIgnoreUserAbort();
if (defined('APP_WEB_DIR')) {
	Q_Bootstrap::addAlias();
	Q_Request::baseUrl();
}
Q::$bootstrapped = true;

//
// Give the project a chance to load aggregated files, etc.
//
Q::event('Q/init');