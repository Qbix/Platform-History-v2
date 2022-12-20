<?php

/**
 * @module Q
 */
/**
 * Q Bootstrap class
 * @class Q_Bootstrap
 */
class Q_Bootstrap
{
	/**
	 * Returns the array of ($pluginName => $pluginDir), in the order they were loaded.
	 * @return array
	 */
	static function plugins()
	{
		return self::$plugins;
	}

	/**
	 * @method setIncludePath
	 * @static
	 */
	static function setIncludePath()
	{
		$paths = array(APP_DIR, Q_DIR, get_include_path());
		set_include_path(implode(PS, $paths));
		chdir('/');
	}
	
	/**
	 * @method registerAutoload
	 * @static
	 */
	static function registerAutoload()
	{
		// Register Q's autoload
		spl_autoload_register(array('Q', 'autoload'), true, true);
		// Register SodiumCompat first
		require_once(Q_CLASSES_DIR.DS.'SodiumCompat'.DS.'autoload.php');
		// Integrating with Composer first (TODO: think of optimizations)
		// requires "vendor/autoload.php" from all plugins, implementing PSR-4
		$composerAutoload = Q_Config::get('Q', 'composer', 'autoload', '*');
		if (!$composerAutoload) {
			return;
		}
		static $loaded = array();
		foreach (Q_Bootstrap::plugins() as $name => $path) {
			if (!empty($loaded[$name])) {
				continue;
			}
			$filename = $path . DS . 'vendor' . DS . 'autoload.php';
			if (file_exists($filename)) {
				include_once$filename;
			};
			$loaded[$name] = true;
		}
	}
	
	
	/**
	 * @method registerExceptionHandler
	 * @static
	 */
	static function registerExceptionHandler()
	{
		self::$prev_exception_handler
		 = set_exception_handler(array('Q', 'exceptionHandler'));
	}
	
	/**
	 * @method prevExceptionHandler
	 * @static
	 * @return {callable}
	 */
	static function prevExceptionHandler()
	{
		return self::$prev_exception_handler;
	}

	/**
	 * @method registerErrorHandler
	 * @static
	 */
	static function registerErrorHandler()
	{
		self::$prev_error_handler = set_error_handler(array('Q', 'errorHandler'));
	}

	/**
	 * @method prevErrorHandler
	 * @static
	 * @return {callable}
	 */
	static function prevErrorHandler()
	{
		return self::$prev_error_handler;
	}
	
	/**
	 * @method defineFunctions
	 * @static
	 */
	static function defineFunctions()
	{
		// We may need to define JSON functions ourselves on PHP < 5.2
		if ( !function_exists('json_decode') ) {
			function json_decode($content, $assoc=false){
				if ( $assoc ){
					$json = new Q_Json(SERVICES_JSON_LOOSE_TYPE);
				} else {
					$json = new Q_Json;
				}
				return $json->decode($content);
			}
		}

		if ( !function_exists('json_encode') ) {
			function json_encode($content){
				$json = new Q_Json;
				return $json->encode($content);
			}
		}
	}
	
	/**
	 * @method registerShutdownFunction
	 * @static
	 */
	static function registerShutdownFunction()
	{
		register_shutdown_function(array('Q_Bootstrap', 'shutdownFunction'));
	}
	
	/**
	 * @method shutdownFunction
	 * @static
	 */
	static function shutdownFunction()
	{
		if ($error = error_get_last()) {
			Q::log($error, 'fatal');
			header('PHP Fatal Error', true, 500); // do not expose the error contents
		}
		/**
		 * @event Q/shutdown {before}
		 */
		Q::event('Q/shutdown', @compact('error'), 'before');
		Q_Cache::shutdownFunction();
		Db_Query_Mysql::shutdownFunction();
		if (Q_Session::id()) {
			session_write_close();
		}
	}

	/**
	 * Used to undo the mangling done by magic_quotes_gpc
	 * @method revertSlashes
	 * @static
	 * @param {string} [$to_strip=null] The string or array to revert. If null, reverts all the PHP input arrays.
	 */
	static function revertSlashes($to_strip = null)
	{		
		if (version_compare(PHP_VERSION, '5.4', '>=')
		or !is_callable('get_magic_quotes_gpc')) {
			return;
		}
		if (get_magic_quotes_gpc()) {
			if (isset($to_strip)) {
				return is_array($to_strip)
				 ? array_map(array('Q_Bootstrap', 'revertSlashes'), $to_strip) 
				 : stripslashes($to_strip);
			}
			$_COOKIE = self::revertSlashes($_COOKIE);
			$_FILES = self::revertSlashes($_FILES);
			$_GET = self::revertSlashes($_GET);
			$_POST = self::revertSlashes($_POST);
			$_REQUEST = self::revertSlashes($_REQUEST);
		}
	}
	
	/**
	 * @method setDefaultTimezone
	 * @static
	 */
	static function setDefaultTimezone()
	{
		$script_tz = Q_Config::get('Q', 'defaultTimezone', 'UTC');
		if (isset($script_tz)) {
			date_default_timezone_set($script_tz);
		}
		Db::setTimezones();
	}
	
	/**
	 * Loads the configuration and plugins in the right order
	 * @method configure
	 * @static
	 * @param boolean [$force_reload=false] If true, forces the reload of the cache.
	 *  Otherwise it happens only if Q/configServer/interval seconds
	 *  have passed since the last time.
	 * @throws {Q_Exception_MissingPlugin}
	 */
	static function configure($force_reload = false)
	{
		$app_tree = new Q_Tree();
		// check if config need to be reloaded
		if (Q_Cache::connected()) {
			// we need to know reload interval
			$app_tree->load('config/Q.json');
			$app_tree->load('config/app.json');
			$app_tree->load('local/app.json');
			$app_tree->load('local/app.json.php');

			$config_files = $app_tree->get('Q', 'configFiles', array());
			foreach ($config_files as $cf) {
				$app_tree->merge(Q_Config::getFromServer($cf));
			}
			// second round to catch configFiles inside configFiles
			$config_files = $app_tree->get('Q', 'configFiles', array());
			foreach ($config_files as $cf) {
				$app_tree->merge(Q_Config::getFromServer($cf));
			}

			$interval = $app_tree->get('Q', 'configServer', 'interval', 60); // reload each minute by default
			$app_tree->clear(null);
			$timestamp = Q_Cache::get("Q_Config\tupdateTime");
			if (!isset($timestamp) || (time() - $timestamp > $interval)) $force_reload = true;
		}

		if ($force_reload) {
			$old_setting = Q_Cache::ignore(true);
		}
		Q_Config::clear(null); // clear the config
		Q_Config::load('config/Q.json');

		// Get the app config, but don't load it yet
		$app_tree->load('config/app.json');
		$app_tree->load('local/app.json');
		$app_tree->load('local/app.json.php');
		
		// Load all the plugin config files first
		$paths = explode(PS, get_include_path());
		$plugins = $app_tree->get('Q', 'plugins', array());
		if (!in_array('Q', $plugins)) {
			array_unshift($plugins, 'Q');
		}
		global $Q_Bootstrap_config_plugin_limit;
		$i = 0;
		foreach ($plugins as $k => $v) {
			++$i;
			if (isset($Q_Bootstrap_config_plugin_limit)
			and $i > $Q_Bootstrap_config_plugin_limit) {
				continue;
			}
			$plugin = is_numeric($k) ? $v : $k;
			$plugin_path = Q::realPath('plugins'.DS.$plugin);
			if (!$plugin_path) {
				throw new Q_Exception_MissingPlugin(@compact('plugin'));
			}
			array_splice($paths, 1, 0, array($plugin_path));
			$PLUGIN = strtoupper($plugin);
			if (!defined($PLUGIN.'_PLUGIN_DIR'))
				define($PLUGIN.'_PLUGIN_DIR', $plugin_path);
			if (!defined($PLUGIN.'_PLUGIN_CONFIG_DIR'))
				define($PLUGIN.'_PLUGIN_CONFIG_DIR', $plugin_path.DS.'config');
			if (!defined($PLUGIN.'_PLUGIN_CLASSES_DIR'))
				define($PLUGIN.'_PLUGIN_CLASSES_DIR', $plugin_path.DS.'classes');
			if (!defined($PLUGIN.'_PLUGIN_FILES_DIR'))
				define($PLUGIN.'_PLUGIN_FILES_DIR', $plugin_path.DS.'files');
			if (!defined($PLUGIN.'_PLUGIN_HANDLERS_DIR'))
				define($PLUGIN.'_PLUGIN_HANDLERS_DIR', $plugin_path.DS.'handlers');
			if (!defined($PLUGIN.'_PLUGIN_PLUGINS_DIR'))
				define($PLUGIN.'_PLUGIN_PLUGINS_DIR', $plugin_path.DS.'plugins');
			if (!defined($PLUGIN.'_PLUGIN_SCRIPTS_DIR'))
				define($PLUGIN.'_PLUGIN_SCRIPTS_DIR', $plugin_path.DS.'scripts');
			if (!defined($PLUGIN.'_PLUGIN_VIEWS_DIR'))
				define($PLUGIN.'_PLUGIN_VIEWS_DIR', $plugin_path.DS.'views');
			if (!defined($PLUGIN.'_PLUGIN_TESTS_DIR'))
				define($PLUGIN.'_PLUGIN_TESTS_DIR', $plugin_path.DS.'tests');
			if (!defined($PLUGIN.'_PLUGIN_WEB_DIR'))
				define($PLUGIN.'_PLUGIN_WEB_DIR', $plugin_path.DS.'web');
			if (!defined($PLUGIN.'_PLUGIN_TEXT_DIR'))
				define($PLUGIN.'_PLUGIN_TEXT_DIR', $plugin_path.DS.'text');
			self::$plugins[$plugin] = $plugin_path;
		}
		$paths = array_unique($paths);
		set_include_path(implode(PS, $paths));

		foreach (self::$plugins as $plugin => $plugin_path) {
			Q_Config::load($plugin_path.DS.'config'.DS.'plugin.json');
		}
		
		// Now, we can merge in our app's config
		Q_Config::merge($app_tree);

		// Now, load any other files we were supposed to load
		$config_files = Q_Config::get('Q', 'configFiles', array());
		foreach ($config_files as $cf) {
			Q_Config::merge(Q_Config::getFromServer($cf));
		}
		// second round to catch configFiles inside configFiles
		$config_files = Q_Config::get('Q', 'configFiles', array());
		foreach ($config_files as $cf) {
			Q_Config::merge(Q_Config::getFromServer($cf));
		}
		$script_files = Q_Config::get('Q', 'scriptFiles', array());
		foreach ($script_files as $cf) {
			Q::includeFile($cf);
		}
		error_reporting(Q_Config::get('Q', 'errorReporting', E_ALL & ~E_NOTICE & ~E_STRICT));
		
		if (isset($old_setting)) {
			Q_Cache::ignore($old_setting);
		}
		set_time_limit(Q_Config::get('Q', 'internal', 'phpTimeout', 300));
		self::setDefaultTimezone();

		Q::$autoloadRequires = Q_Config::get('Q', 'autoload', 'requires', array());
		
		Q::event('Q/configure', @compact(
			'app_tree', 'config_files', 'script_files'
		), 'after');
	}
	
	static function alertAboutLocalConfiguration()
	{
		if (defined('CONFIGURE_ORIGINAL_APP_NAME')) {
			return; // let the configurarion happen without the alert
		}
		$app = Q_Config::get('Q', 'app', null);
		$prefix = $app ? "$app/" : '';
		if (Q_Config::get('Q', 'localNotYetConfigured', null)) {
			throw new Q_Exception("Please edit local config in {{prefix}}local/app.json");
		}
	}
	
	/**
	 * @method checkRequirements
	 * @static
	 * @param {array} [$plugins=null]
	 * @return {boolean}
	 * @throws {Q_Exception_Requirement}
	 * @throws {Q_Exception_RequirementVersion}
	 */
	static function checkRequirements($plugins = null)
	{
		if (!isset($plugins)) {
			$plugins = Q::plugins();
		}
		$infos = Q_Config::get('Q', 'pluginInfo', array());
		$local = Q_Config::get('Q', 'pluginLocal', array());

		foreach ($infos as $plugin => $info) {
			if (!in_array($plugin, $plugins)) {
				continue;
			}
			if (isset($info['requires']) and is_array($info['requires'])) {
				foreach ($info['requires'] as $required_plugin => $required_version) {

					if(!isset($local[$required_plugin])) {
						throw new Q_Exception_Requirement(array(
							'plugin' => $required_plugin,
							'version' => $required_version,
							'by' => $plugin,
						));
					}

					$installed_version = isset($local[$required_plugin]['version']) ? $local[$required_plugin]['version'] : 0;
					$compatible_version = isset($local[$required_plugin]['compatible']) ? $local[$required_plugin]['compatible'] : 0;

					if (Q::compareVersion($installed_version, $required_version) < 0) {
						throw new Q_Exception_RequirementVersion(array(
							'plugin' => $required_plugin,
							'version' => $required_version,
							'by' => $plugin,
							'installed' => $installed_version,
							'compatible' => $compatible_version,
						));
					}

					if (Q::compareVersion($compatible_version, $required_version) > 0) {
						throw new Q_Exception_RequirementVersion(array(
							'plugin' => $required_plugin,
							'version' => $required_version,
							'by' => $plugin,
							'installed' => $installed_version,
							'compatible' => $compatible_version,
						));
					}
				}
			}
		}
		
		return true;
	}

	/**
	 * @method checkRequirementsApp
	 * @static
	 * @throws {Q_Exception_AppRequirement}
	 * @throws {Q_Exception_AppRequirementVersion}
	 */
	static function checkRequirementsApp()
	{
		$title = Q_Config::expect('Q','app');
		$required = Q_Config::get('Q', 'appInfo', 'requires', array());
		$local = Q_Config::get('Q', 'pluginLocal', array());

		foreach($required as $required_plugin => $required_version) {
			if(!isset($local[$required_plugin])) {
				throw new Q_Exception_AppRequirement(array(
					'plugin' => $required_plugin,
					'version' => $required_version,
					'by' => $title
				));
			}

			$installed_version = isset($local[$required_plugin]['version']) ? $local[$required_plugin]['version'] : 0;
			$compatible_version = isset($local[$required_plugin]['compatible']) ? $local[$required_plugin]['compatible'] : 0;

			if (Q::compareVersion($installed_version, $required_version) < 0) {
				throw new Q_Exception_AppRequirementVersion(array(
					'plugin' => $required_plugin,
					'version' => $required_version,
					'by' => $title,
					'installed' => $installed_version,
					'compatible' => $compatible_version,
				));
			}

			if (Q::compareVersion($compatible_version, $required_version) > 0) {
				throw new Q_Exception_AppRequirementVersion(array(
					'plugin' => $required_plugin,
					'version' => $required_version,
					'by' => $title,
					'installed' => $installed_version,
					'compatible' => $compatible_version,
				));
			}
		}
	}
	
	/**
	 * Adds the first alias to the configuration
	 * @method addAlias
	 * @static
	 */
	static function addAlias()
	{
		if (defined('APP_WEB_DIR')) {
			Q_Config::set('Q', 'aliases', '', APP_WEB_DIR);
		}
	}
	
	/**
	 * Sets whether the response is buffered from the config, if any
	 * @method setResponseBuffered
	 * @static
	 */
	static function setResponseBuffered()
	{
		$handler = Q_Config::get('Q', 'response', 'isBuffered', null);
		if (isset($handler)) {
			Q_Response::isBuffered($handler);
		}
	}
	
	/**
	 * Sets whether the response is buffered from the config, if any
	 * @method setResponseBuffered
	 * @static
	 */
	static function setUrls()
	{
		$url = Q_Config::get('Q', 'response', 'cacheBaseUrl', null);
		if (isset($url)) {
			Q_Uri::cacheBaseUrl($url);
		}
	}

	/**
	 * Loads and executes arbitrary signed PHP code, e.g. from a secure database.
	 * This function requires at least two signatures corresponding to two publicKeys
	 * that are found whitelisted on Q/code/publicKeys config.
	 * SECURITY NOTES:
	 * To compromise this and execute arbitrary PHP code, 
	 * two different trusted entities on the whitelist need to have private keys
	 * compromised, and still remain on the whitelist. They then need to convince
	 * a Qbix site to install the updated code from a specific whitelisted https URL
	 * which is also compromised.
	 * This attack surface is actually not bigger than when the official
	 * company signs and releases code that people voluntarily install using SSH.
	 * In fact, if anything, it just a generalization that allows code to be
	 * downloaded by HTTP, and stored in a database, by users who don't use SSH.
	 * It requires at least TWO keys to sign the code
	 * (presumably the keys would be from independent organizations vetting the code).
	 * The signatures are applied to a SHA-256 hash of the data, so collisions are infeasible.
	 * @return {mixed} The return value of the code
	 * @throws Q_Exception_BadValue
	 */
	static function executeSignedPHPCode($source, $signatures, $publicKeys)
	{
		$pks = Q_Config::expect('Q', 'code', 'publicKeys');
		if (count($signatures) < 2 or count($publicKeys) != count($signatures)) {
			throw new Q_Exception_BadValue(array(
				'internal' => 'signatures and publicKeys',
				'problem' => 'both arrays have to be same length, greater than 1'
			));
		}
		foreach ($publicKeys as $i => $pk) {
			if (in_array($pk, $pks)) {
				throw new Q_Exception_BadValue(array(
					'internal' => $pk,
					'problem' => 'not among whitelisted public keys'
				));
			}
			if (!Q_Crypto::verify($source, $signatures[$i], $pk)) {
				throw new Q_Exception_BadValue(array(
					'internal' => 'source code',
					'problem' => 'invalid signature'
				));
			}
		}
		// SECURITY: In addition to the signature, make sure
		// you're only providing source code that was stored
		// by a secure process, such as downloading from a
		// specific trusted https website.
		return include($source); // execute this PHP code in this context
	}

	/**
	 * @property $prev_exception_handler
	 * @type callable
	 * @protected
	 * @static
	 */
	protected static $prev_exception_handler;
	/**
	 * @property $prev_error_handler
	 * @type callable
	 * @protected
	 * @static
	 */
	protected static $prev_error_handler;
	
	/**
	 * @property $plugins
	 * @type array
	 * @protected
	 * @static
	 */
	protected static $plugins = array();
}

if (!function_exists('t')) {
	function t($text)
	{
		// Give handlers a chance to process this text
		/**
		 * @event Q/text {before}
		 */
		Q::event('Q/text', array(), 'before', $text);
		return $text;
	}
}
