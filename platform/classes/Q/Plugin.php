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
		if (!class_exists('Q', false))
			if (!file_exists($Q_file = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'Q.php'))
				throw new Exception("$Q_file not found");
			else
				include($Q_file);

		if (!class_exists('Q', false))
			throw new Exception("Could not load Qbix Platform");

		// Is APP_DIR defined and does it exist?
		if (!defined('APP_DIR'))
			throw new Exception("APP_DIR is not defined");
		if (!is_dir(APP_DIR))
			throw new Exception(APP_DIR . " doesn't exist or is not a directory");
		if (!defined('APP_WEB_DIR'))
			throw new Exception("APP_WEB_DIR is not defined");
		if (!defined('APP_LOCAL_DIR'))
			throw new Exception("APP_LOCAL_DIR is not defined");

	}

	/**
	 * Install or update schema for app or plugin
	 * @method installSchema
	 * @static
	 * @param {string} $base_dir The directory where application or plugin is located
	 * @param {string} $name The name of application or plugin
	 * @param {string} $type One of 'app' or 'plugin'
	 * @param {string} $conn_name The name of the connection to affect
	 * @param {string} $options Contain data parsed from command line
	 * @throws {Exception} If cannot connect to database
	 */
	static function installSchema($base_dir, $name, $type, $conn_name, $options)
	{
		// is schema installation requested?
		if (!isset($options['sql']) || empty($options['sql'][$conn_name]) || !$options['sql'][$conn_name]['enabled']) return;

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

			// Do we already have $name installed?
			// Checking SCHEMA plugin version in the DB.
			$db->rawQuery("CREATE TABLE IF NOT EXISTS `{$prefix}Q_{$type}` (
				`{$type}` VARCHAR(255) NOT NULL,
				`version` VARCHAR( 255 ) NOT NULL,
				PRIMARY KEY (`{$type}`)) ENGINE = InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
			")->execute();

			$res = $db->select('version', "{$prefix}Q_{$type}")
						->where(array($type => $name))
						->fetchAll(PDO::FETCH_ASSOC);

			// If we have version in the db then this is upgrade
			if (!empty($res)) {
				$current_version = $res[0]['version'];
				echo ucfirst($type)." '$name' schema on '$conn_name'$shard_text (v. $current_version) is already installed" . PHP_EOL;
				if (Q::compare_version($current_version, $version) < 0)
					echo "Upgrading '$name' on '$conn_name'$shard_text schema to version: $version" . PHP_EOL;
				else continue;
			} else {
				// Otherwise considering that plugin has version '0' to override it for getSqlScripts()
				$current_version = 0;
			}

			// collect script files for upgrade
			$scriptsdir = $base_dir.DS.'scripts'.DS.$name;
			$scripts = array();

			if (!is_dir($scriptsdir)) return;

			$dir = opendir($scriptsdir);

			// Find all scripts for this dbms
			while (($entry = readdir($dir)) !== false) {
				$parts = preg_split('/(-|__)/', $entry, 2);
				// wrong filename format
				if (count($parts) < 2) continue;
				list($sqlver, $tail) = $parts;
				if ($tail !== "$conn_name.$dbms" and $tail !== "$conn_name.$dbms.php") {
					continue; // not schema file or php script
				}

				// If this sql file is for earlier or same plugin version than installed - skip it
				// If this sql file is for later plugin version than we are installing - skip it
				if (Q::compare_version($sqlver, $current_version) <= 0
					|| Q::compare_version($sqlver, $version) > 0) continue;

				// we shall install this script!
				if ($tail !== "$conn_name.$dbms.php") {
					$scripts[$sqlver] = $entry;
				} else {
					$scripts["$sqlver.php"] = $entry;
				}
			}

			closedir($dir);

			// Sort scripts according to version
			uksort($scripts, array('Q', 'compare_version'));

			if (!empty($scripts)) {
				echo "Running SQL scripts for $type $name on $conn_name ($dbms)".PHP_EOL;
			}

			// echo "Begin transaction".PHP_EOL;
			// $query = $db->rawQuery('')->begin()->execute();

			// Process script files
			foreach ($scripts as $script) {

				try {
					if (substr($script, -4) === '.php') {
						echo "Processing PHP file: $script \n";
						Q::includeFile($scriptsdir.DS.$script);
						continue;
					}

					echo "Processing SQL file: $script ";
					$sqltext = file_get_contents($scriptsdir.DS.$script);
					$sqltext = str_replace('{$prefix}', $prefix, $sqltext);
					$sqltext = str_replace('{$dbname}', $db->dbname, $sqltext);

					$queries = $db->scriptToQueries($sqltext);
					// Process each query
					foreach ($queries as $q) {
						$db->rawQuery($q)->execute();
						echo ".";
					}

					// Update plugin db version
					if ($dbms === 'mysql') {
						list($newver) = preg_split('/(-|__)/', $script, 2);
						$db->insert("{$prefix}Q_{$type}", array($type=>$name, 'version'=>$newver))
							->onDuplicateKeyUpdate(array('version'=>$newver))
							->execute();
						$current_version = $newver;
					}
					echo PHP_EOL;
				} catch (Exception $e) {
					$errorCode = $pdo->errorCode();
					if ($errorCode != '00000') {
						$info = $pdo->errorInfo();
						$err = new Q_Exception(
							"$info[2]", array(), $errorCode, 
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
				if (Q::compare_version($version, $current_version) > 0)
					$db->insert("{$prefix}Q_{$type}", array($type=>$name, 'version'=>$version))
						->onDuplicateKeyUpdate(array('version'=>$version))
						->execute();
			} catch (Exception $e) {
				if ($pdo->errorCode() != '00000') {
					// echo "Rollback".PHP_EOL;
					// $query = $db->rawQuery('')->rollback()->execute();
					// $err = $pdo->errorInfo();
					throw new Exception("$err[2]");
				}
			}
			// echo "Commit transaction".PHP_EOL;
			// $query = $db->rawQuery('')->commit()->execute();
			echo '+ ' . ucfirst($type) . " '$name' schema on '$conn_name'$shard_text (v. $current_version -> $version) installed".PHP_EOL;
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
						echo Q_Utils::colored("[WARN] Couldn't change group for $file", 'red', 'yellow')."\n";
					}
					if ($modefix and !chmod($file, $mode)) {
						echo Q_Utils::colored("[WARN] Couldn't fix permissions for $file", 'red', 'yellow')."\n";
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
			mkdir($files_dir, $options['dirmode']);
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
		self::checkPermissions(Q_FILES_DIR, $options);
		self::checkPermissions(APP_FILES_DIR, $options);

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
		$plugin_dir = Q_PLUGINS_DIR . DS . $plugin_name;
		$app_web_plugins_dir = APP_WEB_DIR.DS.'plugins';

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
		if(!file_exists($app_web_plugins_dir))
			if(!@mkdir($app_web_plugins_dir, 0755, true))
				throw new Exception("Could not create $app_web_plugins_dir");
		if(!is_dir($app_web_plugins_dir))
			throw new Exception("$app_web_plugins_dir exists, but is not a directory");
		elseif(!is_writable($app_web_plugins_dir))
			throw new Exception("Can not write to $app_web_plugins_dir");

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
		//  Do we already have this plugin installed for this app?
		// Check requirements for plugin (will throw exceptions if they aren't met)
		if(!isset($options['noreq']) || !$options['noreq']) {
			echo "Checking requirements".PHP_EOL;
			Q_Bootstrap::checkRequirements(array($plugin_name));
		}

		//  Checking LOCAL plugin version in plugins.json file
		if (($version_installed = Q_Config::get('Q', 'pluginLocal', $plugin_name, 'version', null)) != null) {
			//We have this plugin installed
			echo "Plugin '$plugin_name' (version: $version_installed) is already installed" . PHP_EOL;
			if (Q::compare_version($version_installed, $plugin_version) < 0)
				echo "Upgrading '$plugin_name' to version: $plugin_version" . PHP_EOL;
		}
		
		// Check and fix permissions
		self::checkPermissions($files_dir, $options);
		if (isset($plugin_conf['permissions'])) {
			foreach ($plugin_conf['permissions'] as $perm) {
				self::checkPermissions($files_dir.DS.$perm, $options);
			}
		}

		// Symbolic links
		echo 'Creating symbolic links'.PHP_EOL;
		Q_Utils::symlink($plugin_dir.DS.'web', $app_web_plugins_dir.DS.$plugin_name);

		//  Checking if schema update is requested and updating database version
		$connections = Q_Config::get('Q', 'pluginInfo', $plugin_name, 'connections', array());
		foreach ($connections as $connection) {
			self::installSchema(Q_PLUGINS_DIR.DS.$plugin_name, $plugin_name, 'plugin', $connection, $options);
		}

		// Push plugin name into Q/plugins array
		if (!in_array($plugin_name, $current_plugins = Q_Config::get('Q', 'plugins', array()))) {
			$current_plugins[] = $plugin_name;
			Q_Config::set('Q', 'plugins', $current_plugins); //TODO: When do we save Q/plugins to disk?
		}

		// Save info about plugin
		echo 'Registering plugin'.PHP_EOL;
		Q_Config::set('Q', 'pluginLocal', $plugin_name, $plugin_conf);
		Q_Config::save($app_plugins_file, array('Q', 'pluginLocal'));

		echo Q_Utils::colored("Plugin '$plugin_name' successfully installed".PHP_EOL, 'green');
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
