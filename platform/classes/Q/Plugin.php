<?php

/**
 * @module Q
 */
/**
 * Plugins manager
 * @class Q_Plugin
 */
class Q_Plugin
{
	/**
	 * Connect Qbix platform if it's not already connected and set up constants
	 * @method prepare
	 * @static
	 * @private
	 * @throws {Exception} If cannot find file Q.php
	 *	or APP_DIR is not defined or does not exists or is not directory
	 * 	or APP_WEB_DIR, APP_LOCAL_DIR not defined
	 */
	static private function prepare() {
		// Connect Qbix platform if it's not already connected
		if (!class_exists('Q', false)) {
			if (!file_exists($Q_file = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'Q.php')) {
				throw new Exception("$Q_file not found");
			} else {
				include($Q_file);
			}
		}
		if (!class_exists('Q', false)) {
			throw new Exception("Could not load Qbix Platform");
		}

		// Is APP_DIR defined and does it exist?
		if (!defined('APP_DIR')) {
			throw new Exception("APP_DIR is not defined");
		}
		if (!is_dir(APP_DIR)) {
			throw new Exception(APP_DIR . " doesn't exist or is not a directory");
		}
		if (!defined('APP_WEB_DIR')) {
			throw new Exception("APP_WEB_DIR is not defined");
		}
		if (!defined('APP_LOCAL_DIR')) {
			throw new Exception("APP_LOCAL_DIR is not defined");
		}

	}

	/**
	 * Get or set extra column from [plugin_name]_Q_plugin or [app_name]_Q_app tables
	 * Also check whether this column exist, and create if not.
	 * @method handleExtra
	 * @static
	 * @param {string} $name The name of application or plugin
	 * @param {string} $type One of 'app' or 'plugin'
	 * @param {string} $conn_name The name of the connection to affect
	 * @param {array} $options
	 * @param {array} $options.extra The information to store in the extra field
	 * @throws {Exception} If cannot connect to database
	 * @return array List of installed stream names
	 */
	static function extra($name, $type, $conn_name, $options = array())
	{
		// Get SQL connection for currently installed schema
		// Is schema connection information provided?
		if (($dbconf = Db::getConnection($conn_name)) == null) {
			throw new Exception("Could not get info for database connection '$conn_name'. Check " . APP_LOCAL_DIR . "/app.json");
		}

		$tempname = $conn_name . '_' . time();
		Db::setConnection($tempname, $dbconf);

		// Try connecting
		try {
			$db = Db::connect($tempname);
			$prefix = $dbconf['prefix'];
		} catch (Exception $e) {
			throw new Exception("Could not connect to DB connection '$conn_name': " . $e->getMessage(), $e->getCode(), $e);
		}

		$db->setAttribute(PDO::MYSQL_ATTR_USE_BUFFERED_QUERY, true);

		$tableName = "{{prefix}}Q_{$type}";

		if ($db->dbms() === 'mysql') {
			$cols = false;

			// check if table exist
			try {
				$cols = $db->rawQuery("SHOW COLUMNS FROM $tableName")
					->execute()->fetchAll(PDO::FETCH_ASSOC);
			} catch (Exception $e) {
				// table not exist
				throw new Exception("Table '$tableName': " . $e->getMessage(), $e->getCode(), $e);
			}

			// check if column "extra" exist, if not - create one
			if ($cols) {
				$found = false;
				foreach ($cols as $col) {
					if ($col['Field'] === 'extra') {
						$found = true;
						break;
					}
				}
				if (!$found) {
					echo "Adding 'extra' column to '$tableName'" . PHP_EOL;
					$db->rawQuery("ALTER TABLE `$tableName` 
						ADD COLUMN `extra` VARCHAR (2047) DEFAULT '{}' COMMENT 'json encoded';")
						->execute();
				}
			}
		}

		if (is_array(Q::ifset($options, 'extra', null))) {
			// update extra
			$db->update($tableName)
				->set(array('extra' => Q::json_encode($options['extra'])))
				->where(array($type => $name))
				->execute();
		}

		// get current extra
		$res = $db->select('extra', $tableName)
			->where(array($type => $name))
			->fetchAll(PDO::FETCH_ASSOC);

		if (!empty($res)) {
			$extra = Q::json_decode($res[0]['extra'], true) ?: array();
		} else {
			$extra = array();
		}

		return $extra;
	}
	/**
	 * Install or update schema for app or plugin
	 * @method installSchema
	 * @static
	 * @param {string} $base_dir The directory where application or plugin is located
	 * @param {string} $name The name of application or plugin
	 * @param {string} $type One of 'app' or 'plugin'
	 * @param {string} $conn_name The name of the connection to affect
	 * @param {array} $options Contain data parsed from command line
	 * @throws {Exception} If cannot connect to database
	 */
	static function installSchema($base_dir, $name, $type, $conn_name, $options)
	{
		// is schema installation requested?
		if (!isset($options['sql'])
		|| empty($options['sql'][$conn_name])
		|| !$options['sql'][$conn_name]['enabled']) {
			return;
		}

		$config = $type === 'app'
			? Q_Config::get('Q', "{$type}Info", null)
			: Q_Config::get('Q', "{$type}Info", $name, null);

		// version to install or update
		$version = $config['version'];

		// Get SQL connection for currently installed schema

		// Is schema connection information provided?
		if (($dbconf = Db::getConnection($conn_name)) == null)
			throw new Exception("Could not get info for database connection '$conn_name'. Check ".APP_LOCAL_DIR."/app.json");

		// If option -sql-user-pass was used, override config's username and password
		// TODO: set pasword per shard
		if (isset($options['sql'][$conn_name]['username'])) {
			$dbconf['username'] = $options['sql'][$conn_name]['username'];
			$dbconf['password'] = self::getPassword($conn_name);
		}

		$shards = array('' => $dbconf);
		if (isset($dbconf['shards']))
			$shards = array_merge($shards, $dbconf['shards']);

		foreach ($shards as $shard => $data) {

			$shard_text = ($shard === '' ? "" : " shard '$shard'");
			$tempname = $conn_name . '_' . time();
			$shard_data = array_merge($dbconf, $data);
			Db::setConnection($tempname, $shard_data);

			// Try connecting
			try {
				$db = Db::connect($tempname);
				$pdo = $db->reallyConnect($shard);
				list($dbms) = explode(':', $shard_data['dsn']);
				$prefix = $shard_data['prefix'];
			} catch (Exception $e) {
				throw new Exception("Could not connect to DB connection '$conn_name'$shard_text: " . $e->getMessage(), $e->getCode(), $e);
			}

			$db->setAttribute(PDO::MYSQL_ATTR_USE_BUFFERED_QUERY, true);

			if ($db->dbms() === 'mysql') {
				// Do we already have $name installed?
				// Checking SCHEMA plugin version in the DB.
				$tableName = "{{prefix}}Q_{$type}";
				$cols = false;
				try {
					$cols = $db->rawQuery("SHOW COLUMNS FROM $tableName")
						->execute()->fetchAll(PDO::FETCH_ASSOC);
				} catch (Exception $e) {
					$db->rawQuery("CREATE TABLE IF NOT EXISTS `$tableName` (
						`{$type}` VARCHAR(63) NOT NULL,
						`version` VARCHAR( 255 ) NOT NULL,
						`versionPHP` VARCHAR (255) NOT NULL,
						PRIMARY KEY (`{$type}`)) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
					")->execute();
				}
				if ($cols) {
					$found = false;
					foreach ($cols as $col) {
						if ($col['Field'] === 'versionPHP') {
							$found = true;
							break;
						}
					}
					if (!$found) {
						$db->rawQuery("ALTER TABLE `$tableName`
							ADD COLUMN `versionPHP` VARCHAR (255) NOT NULL AFTER `version`;
						")->execute();
						$db->update($tableName)->set(array(
							'versionPHP' => new Db_Expression('version')
						))->execute();
					}
				}
			}

			$res = $db->select('version, versionPHP', "{{prefix}}Q_{$type}")
				->where(array($type => $name))
				->fetchAll(PDO::FETCH_ASSOC);

			// If we have version in the db then this is upgrade
			if (!empty($res)) {
				$current_version = $res[0]['version'];
				$current_versionPHP = $res[0]['versionPHP'];
				echo ucfirst($type)." '$name' schema on '$conn_name'$shard_text (SQL $current_version, PHP $current_versionPHP) is already installed" . PHP_EOL;
				if (Q::compareVersion($current_version, $version) < 0
					or Q::compareVersion($current_versionPHP, $version) < 0) {
					echo "Upgrading '$name' on '$conn_name'$shard_text schema to version: SQL $version" . PHP_EOL;
				}
			} else {
				// Otherwise considering that plugin has version '0' to override it for getSqlScripts()
				$current_version = $current_versionPHP = 0;
			}

			// collect script files for upgrade
			$scriptsdir = $base_dir.DS.'scripts'.DS.$name;
			$scriptsSQL = array();
			$scriptsPHP = array();

			if (!is_dir($scriptsdir)) return;

			$dir = opendir($scriptsdir);

			// Find all scripts for this dbms
			while (($entry = readdir($dir)) !== false) {
				$parts = preg_split('/(-|__)/', $entry, 2);
				// wrong filename format
				if (count($parts) < 2) continue;
				list($sqlver, $tail) = $parts;
				if ($tail !== "$conn_name.$dbms"
					and $tail !== "$conn_name.$dbms.php") {
					continue; // not schema file or php script
				}

				// If this sql file is for later plugin version than we are installing - skip it
				if (Q::compareVersion($sqlver, $version) > 0) {
					continue;
				}

				// we shall install this script!
				if ($tail === "$conn_name.$dbms"
					and Q::compareVersion($sqlver, $current_version) > 0) {
					$scriptsSQL["$sqlver"] = $entry;
				} else if ($tail === "$conn_name.$dbms.php"
					and Q::compareVersion($sqlver, $current_versionPHP) > 0) {
					$scriptsPHP["$sqlver"] = $entry;
				}
			}

			closedir($dir);

			// Sort scripts according to version
			uksort($scriptsSQL, array('Q', 'compareVersion'));
			uksort($scriptsPHP, array('Q', 'compareVersion'));

			if (!empty($scripts)) {
				echo "Running SQL scripts for $type $name on $conn_name ($dbms)".PHP_EOL;
			}

			$scripts = array();
			foreach ($scriptsSQL as $s) {
				$scripts[] = $s;
			}
			foreach ($scriptsPHP as $s) {
				$scripts[] = $s;
			}

			// echo "Begin transaction".PHP_EOL;
			// $query = $db->rawQuery('')->begin()->execute();

			$original_version = $current_version;

			// Process script files
			foreach ($scripts as $script) {

				try {
					list($new_version) = preg_split('/(-|__)/', $script, 2);
					if (substr($script, -4) === '.php') {
						echo "Processing PHP file: $script " . PHP_EOL;
						Q::includeFile($scriptsdir.DS.$script);
						$db->update("{{prefix}}Q_{$type}")->set(array(
							'versionPHP' => $new_version
						))->where(array(
							$type => $name
						))->execute();
						continue;
					}

					echo "Processing SQL file: $script ";
					$sqltext = file_get_contents($scriptsdir.DS.$script);
					$sqltext = str_replace('{{prefix}}', $prefix, $sqltext);
					$sqltext = str_replace('{{dbname}}', $db->dbname, $sqltext);

					/**
					 * @event Q/Plugin/installSchema {before}
					 * @param {string} $base_dir The directory where application or plugin is located
					 * @param {string} $name The name of application or plugin
					 * @param {string} $type One of 'app' or 'plugin'
					 * @param {string} $conn_name The name of the connection to affect
					 * @param {array} $options Contain data parsed from command line
					 * @param {string} $shard
					 * @param {array} $shard_data
					 * @param {string} $new_version
					 * @param {string} $current_version
					 * @param {string} $script The script to execute
					 */
					$ret = Q::event("Q/Plugin/installSchema", @compact(
						'base_dir', 'name', 'type', 'options',
						'conn_name', 'connection',
						'shard', 'shard_data',
						'script', 'newver', 'current_version'
					), 'before');
					if ($ret === false) {
						continue;
					}

					$queries = $db->scriptToQueries($sqltext);
					// Process each query
					foreach ($queries as $q) {
						$db->rawQuery($q)->execute();
						echo ".";
					}

					// Update plugin db version
					if ($dbms === 'mysql') {
						$fields = array(
							$type => $name,
							'version' => $new_version,
							'versionPHP' => 0
						);
						$db->insert("{{prefix}}Q_{$type}", $fields)
							->onDuplicateKeyUpdate(array('version' => $new_version))
							->execute();
						$current_version = $new_version;
					}
					echo PHP_EOL;
				} catch (Exception $e) {
					$errorCode = $pdo->errorCode();
					if ($errorCode != '00000') {
						$info = $pdo->errorInfo();
						$message = $info[2];
						if (isset($e->params['sql'])) {
							$message .= PHP_EOL . "Query was: " . $e->params['sql'];
						}
						$err = new Q_Exception(
							$message, array(), $errorCode,
							$e->getFile(), $e->getLine(),
							$e->getTrace(), $e->getTraceAsString()
						);
					} else {
						$err = $e;
					}
					throw $err;
					// echo PHP_EOL;
					// echo "Rollback".PHP_EOL;
					// try {
					// 	$query = $db->rawQuery('')->rollback()->execute();
					// } catch (Exception $e) {
					// 	throw $err;
					// }
				}
			}
			try {
				if (Q::compareVersion($version, $current_version) > 0
					or Q::compareVersion($version, $current_versionPHP) > 0) {
					echo '+ ' . ucfirst($type) . " '$name' schema on '$conn_name'$shard_text (v. $original_version -> $version) installed".PHP_EOL;
					$db->insert("{{prefix}}Q_{$type}", array(
						$type => $name,
						'version' => $version,
						'versionPHP' => $version
					))->onDuplicateKeyUpdate(array(
						'version' => $version,
						'versionPHP' => $version
					))->execute();
				}
			} catch (Exception $e) {
				if ($pdo->errorCode() != '00000') {
					// echo "Rollback".PHP_EOL;
					// $query = $db->rawQuery('')->rollback()->execute();
					$info = $pdo->errorInfo();
					$message = $info[2];
					if (isset($e->params['sql'])) {
						$message .= PHP_EOL . "Query was: " . $e->params['sql'];
					}
					throw new Q_Exception(
						$message, array(), $pdo->errorCode(),
						$e->getFile(), $e->getLine(),
						$e->getTrace(), $e->getTraceAsString()
					);
				}
			}
			// echo "Commit transaction".PHP_EOL;
			// $query = $db->rawQuery('')->commit()->execute();
		}
	}

	/**
	 * @method checkTree
	 * @static
	 * @private
	 * @param {string} $root
	 * @param {integer} $filemode
	 * @param {integer} $dirmode
	 * @param {string|integer|false} [$gid=false]
	 * @param {boolean} [$ask=true]
	 * @return {boolean}
	 */
	static private function checkTree($root, $filemode, $dirmode, $gid = false, $ask = true) {
		// fix permissions for current folder
		$ask = self::fixPermissions($root, $dirmode, $gid, $ask);
		foreach (glob($root.'*', GLOB_MARK) as $path) {
			if ($path[strlen($path)-1] == DS) {
				$ask = self::checkTree($path, $filemode, $dirmode, $gid, $ask);
			} else {
				$ask = self::fixPermissions($path, $filemode, $gid, $ask);
			}
		}
		return $ask;
	}

	/**
	 * @method fixPermissions
	 * @static
	 * @private
	 * @param {string} $file
	 * @param {integer} $mode
	 * @param {string|integer|false} [$gid=false]
	 * @param {boolean} [$ask=true]
	 * @return {boolean}
	 */
	static private function fixPermissions($file, $mode, $gid = false, $ask = true) {
		$line = '';
		$modefix = $groupfix = false;
		if(($modefix = (fileperms($file) & 0777) != $mode)
			|| ($groupfix = $gid !== false && filegroup($file) !== $gid)) {

			if ($ask) {
				echo("Fix permissions for '$file' [y/n/all]? ");
				$line = trim(fgets(STDIN));
			}
			switch ($line) {
				case 'all':
					$ask = false;
				case '':
				case 'y':
				case 'Y':
					if ($groupfix and !chgrp($file, $gid)) {
						echo Q_Utils::colored("[WARN] Couldn't change group for $file", 'red', 'yellow').PHP_EOL;
					}
					if ($modefix and !chmod($file, $mode)) {
						echo Q_Utils::colored("[WARN] Couldn't fix permissions for $file", 'red', 'yellow').PHP_EOL;
					}
					break;
				default:
					break;
			}
		}
		return $ask;
	}

	/**
	 * @method checkPermissions
	 * @static
	 * @private
	 * @param {string} $files_dir
	 * @param {array} $options
	 */
	static function checkPermissions($files_dir, $options) {
		// Check and fix permissions
		if(!file_exists($files_dir)) {
			$mask = umask(Q_Config::get('Q', 'internal', 'umask', 0000));
			mkdir($files_dir, $options['dirmode'], true);
			umask($mask);
		}

		// if group is supplied, convert name to gid
		if (isset($options['group'])) {
			$group = $options['group'];
			if (!is_numeric($group)) {
				$posix = posix_getgrnam($group);
				$group = $posix['gid'];
			}
		} else {
			$group = false;
		}

		if (isset($options['deep'])) {
			self::checkTree($files_dir, $options['filemode'], $options['dirmode'], $group);
		} else {
			self::fixPermissions($files_dir, $options['dirmode'], $group);
		}
	}

	/**
	 * @method installApp
	 * @static
	 * @param {array} $options
	 * @throws {Exception}
	 */
	static function installApp($options) {
		// Connect Qbix platform if it's not already connected
		self::prepare();

		set_time_limit(Q_Config::expect('Q', 'install', 'timeLimit'));

		// application data shall be defined in it's config
		$APP_NAME = Q_Config::get('Q', 'app', null);
		$APP_CONF = Q_Config::get('Q', 'appInfo', null);
		$APP_VERSION = $APP_CONF['version'];

		$app_dir = APP_DIR;

		echo "Installing app '$APP_NAME' (version: $APP_VERSION) into '$app_dir'" . PHP_EOL;

		// Ensure that the app has config/app.json
		if (!file_exists($app_conf_file = $app_dir . DS . 'config' . DS . 'app.json'))
			throw new Exception("Could not load apps's config. Check $app_conf_file");

		$files_dir = APP_FILES_DIR;
		$app_installed_file = APP_LOCAL_DIR.DS.'installed.json';
		$app_plugins_file = APP_LOCAL_DIR.DS.'plugins.json';
		if (file_exists($app_plugins_file)) {
			Q_Config::load($app_plugins_file);
		}
		// Check requirements for app (will throw exceptions if they aren't met)
		if(!isset($options['noreq']) || !$options['noreq']) {
			echo "Checking requirements".PHP_EOL;
			Q_Bootstrap::checkRequirementsApp();
		}

		// Check access to $app_installed_file
		if(file_exists($app_installed_file) && !is_writable($app_installed_file))
			throw new Exception("Can not write to $app_installed_file");
		elseif(!file_exists($app_installed_file) && !is_writable(dirname($app_installed_file)))
			throw new Exception("Can not write to ".dirname($app_installed_file));

		if (file_exists($app_installed_file)) {
			Q_Config::load($app_installed_file);
		}

		// Check access to $files_dir
		if(!file_exists($files_dir)) {
			if(!@mkdir($files_dir, $options['dirmode'], true)) {
				throw new Exception("Could not create $files_dir");
			}
		}

		// Do we now have app's config?
		if (Q_Config::get('Q', 'app', null) == null) {
			throw new Exception("Could not identify app name. Check $app_conf_file");
		}

		// Do we now have app's config?
		if (Q_Config::get('Q', 'appInfo', 'version', null) == null) {
			throw new Exception("Could not identify app version. Check $app_conf_file");
		}

		// Check and fix permissions
		self::checkPermissions(APP_FILES_DIR, $options);

		// Use package managers
		self::npmInstall(APP_DIR, !empty($options['npm']));
		self::composerInstall(APP_DIR, !empty($options['composer']));

		// install or update application schema
		$connections = Q_Config::get('Q', 'appInfo', 'connections', array());
		foreach ($connections as $connection) {
			self::installSchema($app_dir, $APP_NAME, 'app', $connection, $options);
		}

		// Save info about app
		echo 'Registering app'.PHP_EOL;
		Q_Config::set('Q', 'appLocal', $APP_CONF);
		Q_Config::save($app_installed_file, array('Q', 'appLocal'));

		// Create .htaccess file if it doesn't exist
		if (!file_exists(APP_WEB_DIR.DS.'.htaccess')) {
			$htaccess = <<<EOT
RewriteEngine on

# uncomment the following line and modify it, if you're having problems:
# You will need to do it on Windows:
#RewriteBase /your_app_local_url/

# we can check if the .html version is here (caching)
#RewriteRule ^$ index.html [QSA]
#RewriteRule ^([^.]+)$ $1.html [QSA]

RewriteCond %{REQUEST_FILENAME} !-f
#RewriteCond %{REQUEST_FILENAME} !-d

# no, so we redirect to our front web controller
RewriteRule ^(.*)$ index.php [QSA,L]
EOT;
			file_put_contents(APP_WEB_DIR.DS.'.htaccess', $htaccess);
		}

		echo Q_Utils::colored("App '$APP_NAME' successfully installed".PHP_EOL, 'green');
	}

	/**
	 * @method installPlugin
	 * @static
	 * @param {string} $plugin_name
	 * @param {array} $options
	 * @throws {Exception}
	 */
	static function installPlugin($plugin_name, $options)
	{
		set_time_limit(Q_Config::expect('Q', 'install', 'timeLimit'));

		// Connect Qbix platform if it's not already connected
		self::prepare();

		$app_dir = APP_DIR;
		$plugin_dir = Q_PLUGINS_DIR.DS.$plugin_name;
		$plugin_text_dir = $plugin_dir.DS.'text'.DS.$plugin_name;
		$app_web_plugins_dir = APP_WEB_DIR.DS.'Q'.DS.'plugins';
		$app_web_text_dir = APP_WEB_DIR.DS.'Q'.DS.'text';
		$app_text_plugin_dir = APP_TEXT_DIR.DS.$plugin_name;

		/**
		 * @event Q/Plugin/install {before}
		 * @param {string} $app_dir the directory where the app is installed
		 * @param {string} $plugin_name the name of the plugin
		 * @param {array} $options options passed to the installPlugin method
		 */
		Q::event("Q/Plugin/install", @compact('app_dir', 'plugin_name', 'options'), 'before');

		echo "Installing plugin '$plugin_name' into '$app_dir'" . PHP_EOL;

		// Do we even have such a plugin?
		if (!is_dir($plugin_dir))
			throw new Exception("Plugin '$plugin_name' not found in " . Q_PLUGINS_DIR);

		// Ensure that the plugin has config.json
		if (!file_exists($plugin_conf_file = $plugin_dir . DS . 'config' . DS . 'plugin.json'))
			throw new Exception("Could not load plugin's config. Check $plugin_conf_file");

		$files_dir = $plugin_dir.DS.'files';
		$app_plugins_file = APP_LOCAL_DIR.DS.'plugins.json';

		// Check access to $app_web_plugins_dir
		$dirs = array($app_web_plugins_dir, $app_web_text_dir);
		foreach ($dirs as $dir) {
			if(!file_exists($dir)) {
				if(!@mkdir($dir, 0755, true)) {
					throw new Exception("Could not create $dir");
				}
			}
			if (!is_dir($dir)) {
				throw new Exception("$dir exists, but is not a directory");
			} else if(!is_writable($dir)) {
				throw new Exception("Can not write to $dir");
			}
		}

		// Check access to $app_plugins_file
		if(file_exists($app_plugins_file) && !is_writable($app_plugins_file))
			throw new Exception("Can not write to $app_plugins_file");
		elseif(!file_exists($app_plugins_file) && !is_writable(dirname($app_plugins_file)))
			throw new Exception("Can not write to ".dirname($app_plugins_file));

		// Check access to $files_dir
		if(!file_exists($files_dir))
			if(!@mkdir($files_dir, $options['dirmode'], true))
				throw new Exception("Could not create $files_dir");

		// Do we now have plugin's config?
		if (Q_Config::get('Q', 'pluginInfo', $plugin_name, 'version', null) == null)
			throw new Exception("Could not identify plugin version. Check $plugin_conf_file");

		$plugin_conf = Q_Config::get('Q', 'pluginInfo', $plugin_name, null);
		$plugin_version = $plugin_conf['version'];

		if (file_exists($app_plugins_file)) {
			Q_Config::load($app_plugins_file, true);
		}
		// Do we already have this plugin installed for this app?
		// Check requirements for plugin (will throw exceptions if they aren't met)
		if(!isset($options['noreq']) || !$options['noreq']) {
			echo "Checking requirements".PHP_EOL;
			Q_Bootstrap::checkRequirements(array($plugin_name));
		}

		//  Checking LOCAL plugin version in plugins.json file
		if (($version_installed = Q_Config::get('Q', 'pluginLocal', $plugin_name, 'version', null)) != null) {
			// We have this plugin installed
			echo "Plugin '$plugin_name' (version: $version_installed) is already installed" . PHP_EOL;
			if (Q::compareVersion($version_installed, $plugin_version) < 0) {
				echo "Upgrading '$plugin_name' to version: $plugin_version" . PHP_EOL;
			}
		}

		// Check and fix permissions
		self::checkPermissions($files_dir, $options);
		if (isset($plugin_conf['permissions'])) {
			foreach ($plugin_conf['permissions'] as $perm) {
				self::checkPermissions($files_dir.DS.$perm, $options);
			}
		}

		// Use package managers
		self::npmInstall($plugin_dir, !empty($options['npm']));
		self::composerInstall($plugin_dir, !empty($options['composer']));

		// Symbolic links
		echo 'Creating symbolic links'.PHP_EOL;
		if (!file_exists($app_web_plugins_dir.DS.$plugin_name)) {
			$p = $app_web_plugins_dir.DS.$plugin_name;
			echo '  '.$p.PHP_EOL;
			Q_Utils::symlink($plugin_dir.DS.'web', $p);
		}

		if (!file_exists($app_text_plugin_dir) and file_exists($plugin_text_dir)) {
			$p = $app_text_plugin_dir;
			echo '  '.$p.PHP_EOL;
			Q_Utils::symlink($plugin_text_dir, $app_text_plugin_dir);
		}

		//  Checking if schema update is requested and updating database version
		$connections = Q_Config::get('Q', 'pluginInfo', $plugin_name, 'connections', array());
		foreach ($connections as $connection) {
			self::installSchema(Q_PLUGINS_DIR.DS.$plugin_name, $plugin_name, 'plugin', $connection, $options);
		}

		// Push plugin name into Q/plugins array
		if (!in_array($plugin_name, $current_plugins = Q::plugins())) {
			$current_plugins[] = $plugin_name;
			Q_Config::set('Q', 'plugins', $current_plugins); //TODO: When do we save Q/plugins to disk?
		}

		// Save info about plugin
		echo 'Registering plugin'.PHP_EOL;
		Q_Config::set('Q', 'pluginLocal', $plugin_name, $plugin_conf);
		Q_Config::save($app_plugins_file, array('Q', 'pluginLocal'));

		/**
		 * @event Q/Plugin/install {after}
		 * @param {string} $app_dir the directory where the app is installed
		 * @param {string} $plugin_name the name of the plugin
		 * @param {array} $options options passed to the installPlugin method
		 */
		Q::event("Q/Plugin/install", @compact('app_dir', 'plugin_name', 'options'), 'after');

		echo Q_Utils::colored("Plugin '$plugin_name' successfully installed".PHP_EOL, 'green');
	}

	static function npmInstall($dir, $doIt = false)
	{
		$exists = $doIt && self::commandExists('npm');
		if (!file_exists($dir . DS . 'package.json') or !$exists) {
			return false;
		}
		echo "Installing npm modules into $dir".DS."node_modules\n";
		$cwd = getcwd();
		chdir($dir);
		shell_exec("npm install");
		chdir($cwd);
		return true;
	}

	static function composerInstall($dir, $doIt = false)
	{
		$exists = $doIt && self::commandExists('composer');
		if (!file_exists($dir . DS . 'composer.json') or !$exists) {
			return false;
		}
		echo "Installing composer packages into $dir".DS."vendor\n";
		$cwd = getcwd();
		chdir($dir);
		shell_exec("composer update --ignore-platform-reqs");
		chdir($cwd);
		return true;
	}

	static function commandExists($cmd) {
		// check which command exist "which" (linux) or "where" (win)
		$is_win = (substr(strtolower(PHP_OS), 0, 3) === 'win');
		$command = $is_win ? "where" : "which";

		if (!$command) {
			return false;
		}

		$return = shell_exec(sprintf("%s %s", $command, escapeshellarg($cmd)));
		return !empty($return);
	}

	/**
	 * Get password for connection
	 * @method getPasword
	 * @static
	 * @private
	 * @param {string} $conn_name
	 * @param {boolean} [$stars=false]
	 * @return {string}
	 */
	private static function getPassword($conn_name, $stars = false)
	{
		echo "Enter password for '$conn_name' connection: ";

		// Get current style
		$oldStyle = shell_exec('stty -g');

		if ($stars === false) {
			shell_exec('stty -echo');
			$password = rtrim(fgets(STDIN), "\n");
		} else {
			shell_exec('stty -icanon -echo min 1 time 0');

			$password = '';
			while (true) {
				$char = fgetc(STDIN);

				if ($char === "\n") {
					break;
				} else if (ord($char) === 127) {
					if (strlen($password) > 0) {
						fwrite(STDOUT, "\x08 \x08");
						$password = substr($password, 0, -1);
					}
				} else {
					fwrite(STDOUT, "*");
					$password .= $char;
				}
			}
		}

		// Reset old style
		shell_exec('stty ' . $oldStyle);

		echo PHP_EOL;

		// Return the password
		return $password;
	}
}
