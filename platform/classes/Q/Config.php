<?php

include_once(dirname(__FILE__).'/Tree.php');

/**
 * @module Q
 */
/**
 * Holds the entire Qbix configuration
 * @class Q_Config
 */
class Q_Config
{
	/**
	 * Loads a configuration file
	 * @method load
	 * @static
	 * @param {string} $filename The filename of the file to load.
	 * @param {boolean} $ignoreCache=false
	 *  Defaults to false. If true, then this function ignores
	 *  the cached value, if any, and attempts to search
	 *  for the file. It will cache the new value.
	 * @return {boolean} Returns true if saved, otherwise false.
	 */
	static function load(
	 $filename,
	 $ignoreCache = false)
	{
		$args = func_get_args();
		if (!isset(self::$tree)) {
			self::$tree = new Q_Tree;
		}
		return call_user_func_array(array(self::$tree, __FUNCTION__), $args);
	}
	
	/**
	 * Saves the configuration to a file
	 * @method save
	 * @static
	 * @param {string} $filename Name of file to save to. If tree was loaded, you can leave this blank to update that file.
	 * @param {array} [$array_path=array()] Array of keys identifying the path of the subtree to save
	 * @param {array} [$prefix_path=array()] The JSON path to save the data under, defaults to array_path
	 * @param {integer} [$flags=0] Any additional flags for json_encode, such as JSON_PRETTY_PRINT
	 * @return {boolean} Returns true if saved, otherwise false.
	 */
	static function save(
	 $filename, 
	 $array_path = array(),
	 $prefix_path = null,
	 $flags = 0)
	{
		$args = func_get_args();
		if (!isset(self::$tree)) {
			self::$tree = new Q_Tree;
		}
		return call_user_func_array(array(self::$tree, __FUNCTION__), $args);
	}
	
	/**
	 * Gets the array of all parameters
	 * @method getAll
	 * @static
	 * @return {array}
	 */
	static function getAll ()
	{
		$args = func_get_args();
		if (!isset(self::$tree)) {
			self::$tree = new Q_Tree;
		}
		return call_user_func_array(array(self::$tree, __FUNCTION__), $args);
	}
	
	/**
	 * Gets the value of a configuration field
	 * @method get
	 * @static
	 * @param {string} $key1 The name of the first key in the configuration path
	 * @param {string} $key2 Optional. The name of the second key in the configuration path.
	 *  You can actually pass as many keys as you need,
	 *  delving deeper and deeper into the configuration structure.
	 *  All but the second-to-last parameter are interpreted as keys.
	 * @param {mixed} $default The last parameter should not be omitted,
	 *  and contains the default value to return in case
	 *  the requested configuration field was not indicated.
	 */
	static function get(
	 $key1,
	 $default)
	{
		$args = func_get_args();
		if (!isset(self::$tree)) {
			self::$tree = new Q_Tree;
		}
		return call_user_func_array(array(self::$tree, __FUNCTION__), $args);
	}
	
	/**
	 * Sets the value of a configuration field
	 * @method set
	 * @static
	 * @param {string} $key1 The name of the first key in the configuration path
	 * @param {string} $key2 Optional. The name of the second key in the configuration path.
	 *  You can actually pass as many keys as you need,
	 *  delving deeper and deeper into the configuration structure.
	 *  All but the second-to-last parameter are interpreted as keys.
	 * @param {mixed} $value The last parameter should not be omitted,
	 *  and contains the value to set the field to.
	 */
	static function set(
	 $key1,
	 $value)
	{
		$args = func_get_args();
		if (!isset(self::$tree)) {
			self::$tree = new Q_Tree;
		}
		return call_user_func_array(array(self::$tree, __FUNCTION__), $args);
	}
	
	/**
	 * Clears the value of a configuration field, possibly deep inside the array
	 * @method clear
	 * @static
	 * @param {string} $key1 The name of the first key in the configuration path
	 * @param {string} $key2 Optional. The name of the second key in the configuration path.
	 *  You can actually pass as many keys as you need,
	 *  delving deeper and deeper into the configuration structure.
	 *  All but the second-to-last parameter are interpreted as keys.
	 */
	static function clear(
	 $key1)
	{
		$args = func_get_args();
		if (!isset(self::$tree)) {
			self::$tree = new Q_Tree;
		}
		return call_user_func_array(array(self::$tree, __FUNCTION__), $args);
	}
	
	/**
	 * Merges parameters over the top of existing parameters
	 * @method merge
	 * @static
	 * @param {array|Q_Tree} $second The array or Q_Tree to merge on top of the existing one
	 */
	static function merge ($second)
	{
		$args = func_get_args();
		if (!isset(self::$tree)) {
			self::$tree = new Q_Tree;
		}
		return call_user_func_array(array(self::$tree, __FUNCTION__), $args);
	}
	
	/**
	 * Gets the value of a configuration field. If it is null or not set,
	 * throws an exception. Otherwise, it is guaranteed to return a non-null value.
	 * @method expect
	 * @static
	 * @param {string} $key1 The name of the first key in the configuration path
	 * @param {string} $key2 Optional. The name of the second key in the configuration path.
	 *  You can actually pass as many keys as you need,
	 *  delving deeper and deeper into the configuration structure.
	 *  All but the second-to-last parameter are interpreted as keys.
	 * @return {mixed} Only returns non-null values
	 * @throws {Q_Exception_MissingConfig} May throw an exception if the config field is missing.
	 */
	static function expect(
		$key1)
	{
		$args = func_get_args();
		if (!isset(self::$tree)) {
			self::$tree = new Q_Tree;
		}
		return call_user_func_array(array(self::$tree, __FUNCTION__), $args);
	}
	
	/**
	 * Check for config server url and return it if found
	 * @method serverInfo
	 * @static
	 * @return {mixed} Config server information or false if config server is not defined
	 * or points to this server
	 */
	static private function serverInfo() {
		$cs = Q_Config::get('Q', 'internal', 'configServer', false);
		if ($cs && isset($cs['url'])) {
			$url = $cs['url'];
		} else $cs = false;
		return $cs;
	}

	/**
	 * Get contents of config file
	 * Config file is searched in APP_DIR/files forder. If config server url is defined
	 * the filename is searched on config server
	 * @method getFromServer
	 * @static
	 * @param {string} $filename The name of the config file. If config server is defined, file is got from there
	 * @return {array} The loaded tree
	 */
	static function getFromServer($filename) {
		if ($cs = self::serverInfo()) {
			// check Q_Cache and if set - use it
			// update class cache as it is not set
			$arr = Q_Cache::get("Q_Config\t$filename", null, $fetched);
			if ($fetched) {
				$tree = new Q_Tree();
				$tree->merge($arr);
				return $tree->getAll();
			}

			// request config server
			if (empty($cs['url'])) {
				return;
			}
			if (!empty($cs['internal'])) {
				// query "internal" Qbix server
				$return = Q_Utils::queryInternal(
					'Q/Config',
					array('Q/method' => 'get', 'filename' => $filename),
					$cs['url']);
			} else {
				// query "external" Qbix server
				$return = Q_Utils::queryExternal(
					'Q/Config',
					array('Q/method' => 'get', 'filename' => $filename),
					$cs['url']);
			}
			Q_Cache::set("Q_Config\t$filename", $return);
			return $return;
		}
		// take local file, return empty tree if file does not exists
		$tree = new Q_Tree();
		if (defined('APP_DIR')) {
			$filename = APP_DIR.DS.'files'.DS.$filename;
		} else {
			throw new Q_Exception("'APP_DIR' is not defined");
		}
		$tree->load($filename);
		return $tree->getAll();
	}

	/**
	 * Modify a config file by merging over new data
	 * Config file is searched in APP_DIR/files forder. If config server url is defined
	 * the filename is searched on config server
	 * @method setOnServer
	 * @static
	 * @param {string} $filename The name of the config file. If config server is defined, file is changed there
	 * @param {array} $data The data to merge to the file
	 * @param {boolean} [$clear=false] Weather data shall be merged over or cleared and set
	 * @return {boolean} Wheather data was successfuly merged in
	 */
	static function setOnServer($filename, $data, $clear = false) {
		if (!is_array($data)) {
			throw new Q_Exception_WrongType(array('field' => 'data', 'type' => 'array'));
		}
		if (is_string($clear)) $clear = json_decode($clear);
		if ($cs = self::serverInfo()) {
			// request config server
			if (!empty($cs['url'])) {
				if (!empty($cs['internal'])) {
					// query "internal" Qbix server
					return Q_Utils::queryInternal(
						'Q/Config',
						array(
							'Q/method' => 'set',
							'filename' => $filename,
							'data' => $data,
							'clear' => $clear),
						$cs['url']);
				} else {
					// query "external" Qbix server
					return Q_Utils::queryExternal(
						'Q/Config',
						array(
							'Q/method' => 'set',
							'filename' => $filename,
							'data' => $data,
							'clear' => $clear),
						$cs['url']);
				}
			}
		}
		// save local file, return empty tree if file does not exists
		$tree = new Q_Tree();
		if (defined('APP_DIR')) {
			$filename = APP_DIR.DS.'files'.DS.$filename;
		} else {
			throw new Q_Exception("'APP_DIR' is not defined");
		}
		if (!file_exists($filename)) {
			$dir = dirname(str_replace('/', DS, $filename));
			if (!is_dir($dir)) {
				$mask = umask(Q_Config::get('Q', 'internal', 'umask', 0000));
				if (!mkdir($dir, 0777, true)) return false;
				umask($mask);
			} elseif (!is_writable($dir)) return false;
		} elseif (!$clear) $tree->load($filename);
		$tree->merge($data);
		return $tree->save($filename);
	}

	/**
	 * Modify a config file by clearing some data
	 * Config file is searched in APP_DIR/files forder. If config server url is defined
	 * the filename is searched on config server
	 * @method clearOnServer
	 * @static
	 * @param {string} $filename The name of the config file. If config server is defined, file is changed there
	 * @param {string|array} [$args=null] OA key or an array of keys for traversing the tree.
	 *	If keys are not supplied the file is cleared
	 *	If all-but-last keys point to plain array, last key is interpreted as a member
	 *	of that array and only this array member is removed
	 *	If all-but-last keys point to associative array (A) and last key is plain array (B)
	 *	all keys from array A which are in array B are unset
	 * @param {boolean} [$noSave=false] Weather result shall be returned or saved. Shall be of type boolean
	 * @return {boolean} Wheather data was successfuly cleared. If some key does not exist still true
	 * @throws {Q_Exception}
	 */
	static function clearOnServer($filename, $args = null, $noSave = false) {
		if (!isset($args) || $args === 'null') $args = array();
		if (is_string($args)) $args = array($args);
		if (is_string($noSave)) $noSave = json_decode($noSave);
		$noSave = !!$noSave;
		if ($cs = self::serverInfo()) {
			// request config server
			if (!empty($cs['url'])) {
				if (!empty($cs['internal'])) {
					// query "internal" Qbix server
					return Q_Utils::queryInternal(
						'Q/Config',
						array(
							'Q/method' => 'clear',
							'filename' => $filename,
							'args' => $args,
							'noSave' => $noSave),
						$cs['url']);
				} else {
					// query "external" Qbix server
					return Q_Utils::queryExternal(
						'Q/Config',
						array(
							'Q/method' => 'clear',
							'filename' => $filename,
							'args' => $args,
							'noSave' => $noSave),
						$cs['url']);
				}
			}
		}
		// modify local file
		if (defined('APP_DIR')) {
			$filename = Q::realPath(APP_DIR.DS.'files'.DS.$filename);
		} else {
			throw new Q_Exception("'APP_DIR' is not defined");
		}
		if (!$filename) return true;
		$tree = new Q_Tree();
		if (count($args)) {
			$tree->load($filename); // if not loaded we consider three empty
			if (count($args) > 1) 
				$last = call_user_func_array(array($tree, "get"), $args);
			else $last = $tree->getAll();
			if (is_array($last)) {
				if (array_keys($last) === range(0, count($last)-1)) {
					// it's plain array and we remove it's member
					$search = array_pop($args);
					if (!is_array($search)) $search = array($search);
					foreach ($search as $value) {
						$keys = array_keys($last, $value);
						for ($deleted=0, $i=0; $i<count($keys); $i++) {
							array_splice($last, $keys[$i]-($deleted++), 1);
						}
					}
					call_user_func_array(array($tree, "clear"), $args);
					if (count($last)) {
						array_push($args, $last);
						call_user_func_array(array($tree, "set"), $args);
					}
				} else {
					// $last is associative array
					$search = array_pop($args);
					if (!is_array($search)) $search = array($search);
					foreach ($search as $value) {
						call_user_func_array(array($tree, "clear"), array_merge($args, array($value)));
					}
				}
			}
		} else $tree = new Q_Tree();
		return $noSave ? $tree->getAll() : $tree->save($filename);
	}

	/**
	 * @property $tree {Q_Tree}
	 * @protected
	 * @static
	 */
	static protected $tree;
	/**
	 * @property $cache {mixed}
	 * @static
	 */
	static $cache = false; // for queries
}
