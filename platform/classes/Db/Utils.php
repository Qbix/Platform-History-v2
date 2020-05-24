<?php

/**
 * @module Db
 */

/**
 * This class lets you do things related to databases and db results
 * @class Db_Utils
 * @static
 */

class Db_Utils
{

	/**
	 * Sort array by given field
	 * @method sort
	 * @static
	 * @param {&array} $dbRows
	 * @param {string} $field_name
	 */
	static function sort (array & $dbRows, $field_name)
	{
		if (empty($field_name))
			throw new Exception('Must supply field name to compare by');
		self::$compare_field_name = $field_name;
		usort($dbRows, array('Db_Utils', 'compare_dbRows'));
	}

	/**
	 * Compare database rows
	 * @method compare_dbRows
	 * @static
	 * @private
	 * @param {array} $dbRow1
	 * @param {array} $dbRow2
	 * @return {integer}
	 */
	static private function compare_dbRows ($dbRow1, $dbRow2)
	{
		$compare_field_name = self::$compare_field_name;
		if ($dbRow1->$compare_field_name > $dbRow2->$compare_field_name)
			return 1; else if ($dbRow1->$compare_field_name == $dbRow2->$compare_field_name)
			return 0; else
			return - 1;
	}

	/**
	 * A very useful function for stripping off only the 
	 * parameters you need from an array. 
	 * Use it for passing parameters to functions in a flexible way.
	 * @method take
	 * @static
	 * @param {array} $from The associative array from which to take the parameters from, 
	 *  consisting of param => value. For example the $_REQUEST array.
	 * @param {array} $parameters An associative array of paramName => defaultValue pairs.
	 *  If the parameter was not found in the $from array, 
	 *  the default value is used.
	 * @param {string} [$prefix=''] If non-empty, then parameter names are
	 * prepended with this prefix before searching in $from is done.
	 * The prefix is stripped out in the resulting array.
	 * Typically used for database rows. 
	 * If $parameters is empty, ALL items in $from with 
	 * keys starting with $prefix are returned.
	 * @return {array} The parameters are stripped off from the $from array, 
	 * according to the above rules, and returned as an array.
	 */
	static function take (array $from, array $parameters, $prefix = '')
	{
		$result = array();
		if (count($parameters) > 0) {
			// There are parameters to strip off. Observe the prefix, too, if any.
			foreach ($parameters as $key => $value) {
				if (array_key_exists($prefix . $key, $from))
					$result[$key] = $from[$prefix . $key]; else {
					$default = $parameters[$key];
					if ($default instanceof Exception)
						throw $default;
					$result[$key] = $default;
				}
			}
		} else if ($prefix > '') {
			// Parameters aren't specified, but a prefix is.
			$prefixlen = strlen($prefix);
			foreach ($from as $key => $value)
				if (strncmp($key, $prefix, $prefixlen) == 0)
					$result[substr($key, $prefixlen)] = $from[$key];
		} else {
			$result = $from;
		}
		return $result;
	}

	/**
	 * Append a message to the log
	 * @method log
	 * @static
	 * @param {string} $message the message to append
	 * @param {integer} [$level=LOG_NOTICE] see E_NOTICE in the php manual, etc.
	 * @param {boolean} [$timestamp=true] whether to prepend the current timestamp
	 * @param {string} [$ident='Db:'] the ident string to prepend to the message
	 */
	static function log ($message, $level = LOG_NOTICE, $timestamp = true, $ident = 'Db: ')
	{
		static $logOpen = false;
		if (! $logOpen)
			openlog($ident, LOG_NDELAY | LOG_PID | LOG_PERROR, LOG_USER);
		$logOpen = true;
		syslog($level, 
			($timestamp ? date('Y-m-d H:i:s') . ' ' : '') . $message);
	}

	/**
	 * Combines a dirname and a basename, using a slash if needed.
	 * Use this function to build up paths with the correct DIRECTORY_SEPARATOR.
	 * @method filename
	 * @static
	 * @param {string} $dirname The part of the the filename to append to.
	 *  May or may not include a slash at the end.
	 * @param {string} [$basename=null] The part of the filename that comes after the slash
	 *  You can continue to pass more tools as the 3rd, 4th etc.
	 *  parameters to this function, and they will all be
	 *  concatenated into one filename.
	 * @return {string} The combined absolute filename. If it does not exist,
	 *  but the filename appended to the current working directory
	 *  exists, then the latter is returned.
	 */
	static function filename (
		$dirname, $basename = null, $basename2 = null)
	{
		$args = func_get_args();
		$pieces = array();
		$count = count($args);
		for ($i = 0; $i < $count - 1; ++ $i) {
			$pieces[] = (substr($args[$i], - 1) == '/' 
			or substr($args[$i], -1) == "\\"
			or substr($args[$i], -1) == DS) 
				? substr($args[$i], 0, - 1) 
				: $args[$i];
		}
		$pieces[] = $args[$count - 1];
		$filename = implode(DS, $pieces);
		if (!file_exists($filename)) {
			// In this case, try the current working directory
			$cwd = getcwd();
			if ($filename[0] != DS and substr($cwd, -1) != DS)
				$filename_try = $cwd . DS . $filename;
			else
				$filename_try = $cwd . $filename;
			$filename_realpath = realpath($filename_try);
			if ($filename_realpath)
				return $filename_realpath;
		}
		return $filename;
	}

	/**
	 * Exports a simple variable into something that looks nice, nothing fancy (for now)
	 * Does not preserve order of array keys.
	 * @method var_export
	 * @static
	 * @param {mixed&} $var the variable to export
	 */
	static function var_export (&$var)
	{
		if (is_string($var)) {
			$var_2 = addslashes($var);
			return "'$var_2'";
		} elseif (is_array($var)) {
			$indexed_values_quoted = array();
			$keyed_values_quoted = array();
			foreach ($var as $key => $value) {
				$value = self::var_export($value);
				if (is_string($key))
					$keyed_values_quoted[] = "'" . addslashes($key) . "' => $value"; else
					$indexed_values_quoted[] = $value;
			}
			$parts = array();
			if (! empty($indexed_values_quoted))
				$parts['indexed'] = implode(', ', $indexed_values_quoted);
			if (! empty($keyed_values_quoted))
				$parts['keyed'] = implode(', ', $keyed_values_quoted);
			$exported = 'array(' . implode(", \n", $parts) . ')';
			return $exported;
		} else {
			return var_export($var, true);
		}
	}

	/**
	 * Saves a text file. Need to enable UTF-8 support here.
	 * @method saveTextFile
	 * @static
	 * @param {string} $filename The name of the file to save to. Can be relative to this file, or full.
	 * @param {string} $contents  The text string to save
	 * @return {integer} The number of bytes saved, or false if not saved
	 */
	static function saveTextFile ($filename, $contents)
	{
		$dir = dirname($filename);
		if (!file_exists($dir)) {
			mkdir($dir, 0755, true);
		}
		if (!is_dir($dir)) {
			return false;
		}
		// TODO: implement semaphore based on filename to eliminate race conditions
		$result = @file_put_contents($filename, $contents, LOCK_EX); 
		// TODO: use FILE_TEXT for UTF-8 in PHP6
		return $result;
	}
	
	/**
	 * Dumps as a table
	 * @method dump_table
	 * @static
	 * @param {array} $rows
	 */
	static function dump_table ($rows)
	{
		$first_row = true;
		$keys = array();
		$lengths = array();
		foreach ($rows as $row) {
			foreach ($row as $key => $value) {
				if ($first_row) {
					$keys[] = $key;
					$lengths[$key] = strlen($key);
				}
				$val_len = strlen((string)$value);
				if ($val_len > $lengths[$key])
					$lengths[$key] = $val_len;
			}
			$first_row = false;
		}
		foreach ($keys as $i => $key) {
			$key_len = strlen($key);
			if ($key_len < $lengths[$key]) {
				$keys[$i] .= str_repeat(' ', $lengths[$key] - $key_len);
			}
		}
		echo PHP_EOL;
		echo implode("\t", $keys);
		echo PHP_EOL;
		foreach ($rows as $i => $row) {
			foreach ($row as $key => $value) {
				$val_len = strlen((string)$value);
				if ($val_len < $lengths[$key]) {
					$row[$key] .= str_repeat(' ', $lengths[$key] - $val_len);
				}
			}
			echo implode("\t", $row);
			echo PHP_EOL;
		}
	}

	/**
	 * Split shard partitin to new shards. It takes the full table or single partition
	 * and split it to multiple partitions according to the number of provided 'parts'.
	 * When doing initioa split 'shard' may be ommited however 'fields' shall be provided
	 * @method split
	 * @static
	 * @param {Q_Tree} $config Contains all necessary information for split procedure in the following format:
	 * @example
	 *	{
	 *		"plugin": "PLUGINNAME", // the name of plugin - shall be used by app
	 *		"connection": "CONNECTIONNAME", // connection - shall be registered with plugin
	 *		"table": "TABLENAME", // the table to shard
	 *		"class": "CLASSNAME", // the class which is stored in the table
	 *		"fields": {"FIELDNAME": "HASH", "FIELDNAME": "HASH", ...}, // Optional. Used only when starting sharding
	 *			"shard": "SHARDNAME" // Optionsl. The shard to split. If no shards defined or SHARDNAME does not exist the script will fail
	 *			// "parts" can be either array of connections or object {"SHARDNAME": connection, ...}
	 *		"parts": {
	 *			"SHARDNAME": {
	 *				"prefix": "PREFIX",
	 *				"dsn": "DSN",
	 *					...
	 *			},
	 *			"SHARDNAME": {
	 *				"prefix": "PREFIX",
	 *				"dsn": "DSN",
	 *					"username": "USERNAME",
	 *					"password": "PASSWORD",
	 *					"driver_options": {
	 *						"3": 2
	 *					}
	 *			},
	 *			...
	 *		}
	 *	}
	 *
	 * @return {boolean} Weather php part of the process completed successfuly
	 */

	static function split ($config) {
		// all input data shall be provided
		// for future extension plugin/connection/table/class are considered unrelated
		if (!($plugin = $config->get('plugin', false))) {
			echo "Plugin name is not defined\n";
			return false;
		}
		// plugin shall be registered!
		if (!Q_Config::get('Q', 'pluginInfo', $plugin, false)) {
			echo "Plugin '$plugin' is not registered in the platform\n";
			return false;
		}
		if (!($connection = $config->get('connection', false))) {
			echo "Connection '$connection' is not defined\n";
			return false;
		}
		// connection shall exist and be registered with plugin!
		if (!Q_Config::get('Db', 'connections', $connection, false)) {
			echo "Connection '$connection' does not exist\n";
			return false;
		}
		if (!in_array($connection, Q_Config::get('Q', 'pluginInfo', $plugin, 'connections', array()))) {
			echo "Connection '$connection' is not registered for plugin '$plugin'\n";
			return false;
		}
		if (!($class = $config->get('class', false))) {
			echo "Class name is not defined\n";
			return false;
		}
		if (!($table = $config->get('table', false))) {
			echo "Table name is not defined\n";
			return false;
		}
		if (!($shard = $config->get('shard', false)) && Q_Config::get('Db', 'connections', $connection, 'shards', false)) {
			echo "Shard to partition is not defined\n";
			return false;
		}
		if (!($parts = $config->get('parts', false))) {
			echo "New parts are not defined\n";
			return false;
		}
		if ($node = $config->get('node', null)) {
			$nodeInternal = Q_Config::expect('Q', 'nodeInternal');
			$node = array("http://{$nodeInternal['host']}:{$nodeInternal['port']}/Q_Utils/query", $node);
		}

		// now we shall distinguish if table is already sharded or not
		if ($shard === false) {
			if (!($fields = $config->get('fields', false))) {
				echo "To start sharding you shall define 'fields' parameter\n";
				return false;
			}
		}

		// weather provided split config is mapped or not
		$split_mapped = (array_keys($parts) !== range(0, count($parts) - 1));

		// set up config for shards if it does not exist yet
		if ($shard === false) {
			$partition = array();
			foreach ($fields as $name => $hash) {
				if (empty($hash)) $hash = 'md5';
				$part = explode('%', $hash);
				$hash = $part[0];
				$len = isset($part[1]) ? $part[1] : Db_Query::HASH_LEN;
				// "0" has the lowest ascii code for both md5 and normalize
				//	$partition[] = $hash === 'md5' ? str_pad('', $len, "0", STR_PAD_LEFT) : str_pad('', $len, " ", STR_PAD_LEFT);
				$partition[] = str_pad('', $len, "0", STR_PAD_LEFT);
				
			}
			$shard = join('.', $partition);
			if (Q_Config::get('Db', 'connections', $connection, 'indexes', $table, false)) {
				echo "Shards are not defined but indexes for table '$table' are defined in local config\n";
				return false;
			}
			// Let's merge in dummy shards section - shard with name '' is handled as single table
			Q_Config::merge(array(
				'Db' => array(
					'connections' => array(
						$connection => array(
							"shards" => array(),
							"indexes" => array(
								$table => array(
									"fields" => $fields,
									"partition" => $split_mapped 
										? array($shard => '')
										: array($shard)
								)
							)
						)
					)
				)
			));
			$shard_name = '';
		}

		// get partition information
		if (!($partition = Q_Config::get('Db', 'connections', $connection, 'indexes', $table, 'partition', false))) {
			echo "Upps, cannot get shards partitioning\n";
			return false;
		}

		// weather main config is mapped or not
		// also $points contains the partitioning array without mapping
		$points = ($mapped = (array_keys($partition) !== range(0, count($partition) - 1))) 
			? array_keys($partition) 
			: $partition;

		$i = array_search($shard, $points);
		$next = isset($points[++$i]) ? $points[$i] : null;
		$fields = Q_Config::expect('Db', 'connections', $connection, 'indexes', $table, 'fields');
		// now $shard and $next contain boundaries for data to split
		// $points contain partitioning array without mapping - array
		// $parts contains split parts (shards) definition - array or object ($split_mapped)
		// $partition contains current partitioning - array or object ($mapped)
		// $fields contains field names and hashes

		// time to calculate new split point(s)
		if (!isset($shard_name))
			$shard_name = $mapped ? $partition[$shard] : $shard;
		$shard_db = $class::db();
		$pdo = $shard_db->reallyConnect($shard_name);
		$shard_table = $class::table();
		$shard_table = str_replace('{{dbname}}', $shard_db->dbname, $shard_table);
		$shard_table = str_replace('{{prefix}}', $shard_db->prefix, $shard_table);

		// verify if current shard is updated to latest version
		$current_version = $shard_db->select('version', "{$shard_db->prefix}Q_plugin")
								->where(array("plugin" => $plugin))
								->fetchAll(PDO::FETCH_ASSOC);
		if (!empty($current_version)) {
			$current_version = $current_version[0]['version'];
			$version = Q_Config::get('Q', "pluginInfo", $plugin, 'version', null);
			if (Q::compareVersion($current_version, $version) < 0) {
				echo "Please, update plugin '$plugin' to version '$version' (currently $current_version)\n";
				return false;
			}
		} else {
			echo "Cannot get installed version of plugin '$plugin'\n";
			return false;
		}

		// We'll limit search with shard boundaries using latin1 string comparison
		$lower = join(explode('.', $shard));
		$upper = isset($next) ? join(explode('.', $next)) : null;
		$normalize = false;

		$where = $group = $order = array();
		foreach(array_keys($fields) as $i => $field) {
			$hash = !empty($fields[$field]) ? $fields[$field] : 'md5';
			$part = explode('%', $hash);
			$normalize = ($normalize || ($hash = strtoupper($part[0])) === 'NORMALIZE');
			$len = isset($part[1]) ? $part[1] : Db_Query::HASH_LEN;
			$group[] = $field;
			$order[] = "CAST($hash($field) AS CHAR($len))";
		}

		// if any field uses 'normalize' hash
		// the original shard shall have MySQL NORMALIZE() function defined
		// MySQL version of NORMALIZE handles only 255 chars and does not add md5 hash
		// (see Db_Utils::normalize)
		if ($normalize) {
			try {
				$pdo->exec("DROP FUNCTION IF EXISTS NORMALIZE;");
				$pdo->exec("CREATE FUNCTION NORMALIZE(s CHAR(255))
						RETURNS CHAR(255) DETERMINISTIC
						BEGIN
					    	DECLARE res CHAR(255) DEFAULT '';
					  		DECLARE t CHAR(1);
					    	WHILE LENGTH(s) > 0 DO
					        	SET t = LOWER(LEFT(s, 1));
					    	    SET s = SUBSTRING(s FROM 2);
					        	IF t REGEXP '[^A-Za-z0-9]' THEN
					            	SET t = '_';
					        	END IF;
					        	SET res = CONCAT(res, t);
					    	END WHILE;
					    	RETURN res;
						END"
					);
			} catch (Exception $e) {
				//echo "ERROR: {$e->getMessage()}\n";
				echo "Please, make sure that db user for shard '$shard_name' has 'CREATE ROUTINE' permission\n";
				return false;
			}
		}

		$order = join(', ', $order);
		$group = join(', ', $group);
		$where = "(STRCMP(CONCAT($order), '$lower') >= 0)"
			.(isset($upper) ? " AND (STRCMP(CONCAT($order), '$upper') < 0)" : "");

		$count = reset($pdo
						->query("SELECT COUNT(*) FROM $shard_table WHERE $where")
						->fetchAll(PDO::FETCH_NUM));

		if (empty($count)) {
			echo "Failed to connect to shard '$shard_name'\n";
			return false;
		}

		$count = reset($count);

		if ($count == 0) {
			echo "Cannot split empty shard!\n";
			return false;
		}

		// if only one new shard provided script will copy data and cnange config
		if (($num_shards = count($parts)) < 1) {
			echo "Please, provide at least one new shard";
			return false;
		}

		$break = round($count/$num_shards);
		// if split config is not mapped and current config is mapped we shall convert split
		//  config to mapped
		$new_partition = ($mapped  || $split_mapped
			? array($shard => ($split_mapped
						? reset(array_keys($parts))
						: $shard))
			: array($shard));
		$new_shards = array($split_mapped ? reset(array_keys($parts)) : $shard => reset($parts));

		$i = 0;
		foreach (array_slice($parts, 1) as $name => $dsn) {
			$offset = $break*(++$i);
			$split = reset($pdo->query("SELECT $group FROM $shard_table WHERE $where ORDER BY $order LIMIT $offset, 1")->fetchAll(PDO::FETCH_ASSOC));
			foreach ($fields as $field => $hash)
				$split[$field] = Db_Query::hashed($split[$field], $hash);
			$split = join('.', $split);
			if ($mapped || $split_mapped) $new_partition[$split] = ($split_mapped ? $name : $split);
			else $new_partition[] = $split;
			$new_shards[$new_name = ($split_mapped ? $name : $split)] = $dsn;
			if (Q_Config::get('Db', 'connections', $connection, 'shards', $new_name, false))
				echo "WARNING!!! Shard already exists: '$new_name'\n";
		}

		Q_Config::merge(array(
			'Db' => array(
				'connections' => array(
					$connection => array(
						"shards" => $new_shards
					)
				)
			)
		));

		// if split config is mapped and current config is not we shall convert app config to mapped
		if ($split_mapped && !$mapped) {
			$partition = array();
			foreach ($points as $point) {
				$partition[$point] = $point;
			}
			Q_Config::set('Db', 'connections', $connection, 'indexes', $table, 'partition', $partition);
			$mapped = true;
		};

		// TODO: verify if new shards sizes are approx. equal

		// Verify versions of existing shards and
		// Install pligin schema to new shards
		Q_Plugin::installSchema(Q_PLUGINS_DIR.DS.$plugin, $plugin, 'plugin', $connection, array('sql' => array($connection => array('enabled' => true))));

		// make sure 'upcoming' config is loaded
		$configFiles = Q_Config::get('Q', 'configFiles', array());

		// 'local/Q/bootstrap.json' should be loaded already but we'll better check
		if (!in_array('Q/config/bootstrap.json', $configFiles)) {
			echo "Config file 'Q/config/bootstrap.json' shall be loaded via 'Q/configFiles key'\non every shard - check 'platform/config/Q.json'\n";
			return false;
		}

		$upcoming_file = Q_Config::get('Q', 'internal', 'sharding', 'upcoming', 'Db/config/upcoming.json');
		//if (!unlink ($upcoming_file)) {
		//	echo "Please, manually remove file '$upcoming_file' and start this script again.\n";
		//	return false;
		//}

		if (!in_array($upcoming_file, $configFiles)) {
			// add upcoming.json to config
			if (!Q_Config::setOnServer(
				'Q/config/bootstrap.json',
				array(
					'Q' => array(
						'configFiles' => array(
							$upcoming_file
						)
					)
				))) {
				echo "Failed to update 'local/Q/bootstrap.json'\n";
				return false;
			}
		}

		// Now after some short time all workers (php and node) will be ready for splitting
		// We'll let node server to wait necessary amount of time.
		$res = Q_Utils::queryInternal('Db/Shards', array(
				'Q/method' => 'split',
				'shard' => $shard_name,
				'shards' => Q::json_encode($new_shards),
				'part' => $shard,
				'table' => $table,
				'dbTable' => $shard_table,
				'class' => $class,
				'plugin' => $plugin,
				'connection' => $connection,
				'where' => $where,
				'parts' => Q::json_encode(array('partition' => $new_partition, 'fields' => $fields))
			), $node);
		if ($res) {
			echo "Split process for shard '$shard_name' ($shard) has started\nPlease, monitor node.js console for important messages and process status\n";
			return true;
		};
		echo "Failed to start split process at node server\n";
		return false;
	}
	
	/**
	 * Attempts to recover interrupted shards split process
	 * @method splitRecover
	 * @static
	 */
	static function splitRecover () {
		if (Q_Config::get('Db', 'upcoming', false) && ($node = Q_Config::get('Db', 'internal', 'sharding', 'logServer', false))) {
			if (Q_Utils::queryInternal('Db/Shards', array('Q/method' => 'reset'), $node)) {
				echo "Split process was reset successfuly\n";
				return true;
			}
		}
		echo "Please, remove 'Db/config/upcoming.json', verify config, drop new shards and start split process again\n";
		return false;
	}
	static $compare_field_name;
}
