<?php

/**
 * @module Q
 */
class Q_Tree
{	
	/**
	 * Used to hold arbitrary-dimensional lists of parameters in Q
	 * @class Q_Tree
	 * @constructor
	 * @param {&array} [$linked_array=null]
	 */
	function __construct(&$linked_array = null)
	{
		if (isset($linked_array)) {
			$this->parameters = &$linked_array;
		}
	}
	
	/**
	 * Gets the array of all parameters
	 * @method getAll
	 * @return {array}
	 */
	function getAll()
	{
		return $this->parameters;
	}
	
	/**
	 * Gets the value of a field, possibly deep inside the array
	 * @method get
	 * @param {string} $key1 The name of the first key in the configuration path
	 * @param {string} $key2 Optional. The name of the second key in the configuration path.
	 *  You can actually pass as many keys as you need,
	 *  delving deeper and deeper into the configuration structure.
	 *  If more than one argument is passed, but the last argument are interpreted as keys.
	 * @param {mixed} $default
	 *  If only one argument is passed, the default is null
	 *  Otherwise, the last argument is the default value to return
	 *  in case the requested field was not found.
	 * @return {mixed}
	 * @throws {Q_Exception_NotArray}
	 */
	function get(
	 $key1,
	 $default = null)
	{
		$args = func_get_args();
		$args_count = func_num_args();
		$result = & $this->parameters;
		if ($args_count <= 1) {
			return isset($result[$key1]) ? $result[$key1] : null;
		}
		$default = $args[$args_count - 1];
		$key_array = array();
		for ($i = 0; $i < $args_count - 1; ++$i) {
			$key = $args[$i];
			if (! is_array($result)) {
				return $default; // silently ignore the rest of the path
				// $keys = '["' . implode('"]["', $key_array) . '"]';
				// throw new Q_Exception_NotArray(compact('keys', 'key'));
			}
			if (!isset($key) or !array_key_exists($key, $result)) {
				return $default;
			}
			if ($i == $args_count - 2) {
				// return the final value
				return $result[$key];
			}
			$result = & $result[$key];
			$key_array[] = $key;
		}
	}
	
	/**
	 * Sets the value of a field, possibly deep inside the array
	 * @method set
	 * @param {string} $key1 The name of the first key in the configuration path
	 * @param {string} $key2 Optional. The name of the second key in the configuration path.
	 *  You can actually pass as many keys as you need,
	 *  delving deeper and deeper into the configuration structure.
	 *  All but the second-to-last parameter are interpreted as keys.
	 * @param {mixed} [$value=null] The value to set the field to.
	 *  The last parameter should not be omitted unless the first parameter is an array.
	 */
	function set(
	 $key1,
	 $value = null)
	{
		$args = func_get_args();
		$args_count = func_num_args();
		if ($args_count <= 1) {
			if (is_array($key1)) {
				foreach ($key1 as $k => $v) {
					$this->parameters[$k] = $v;
				}
			}
			return null;
		}
		$value = $args[$args_count - 1];
		$result = & $this->parameters;

		for ($i = 0; $i < $args_count - 1; ++$i) {
			if (! is_array($result)) {
				$result = array(); // overwrite with an array 
			}
			$key = $args[$i];
			if ($i === $args_count - 2) {
				break; // time to set the final value
			}
			if (isset($key)) {
				$result = & $result[$key];
			} else {
				$result = & $result[];
			}
			if (!is_array($result)) {
				// There will be more arguments, so
				// overwrite $result with an array
				$result = array();
			}
		}

		// set the final value
		if (isset($key)) {
			$key = $args[$args_count - 2];
			$result[$key] = $value;
		} else {
			$result[] = $value;
		}
		return $value;
	}
	
	/**
	 * Clears the value of a field, possibly deep inside the array
	 * @method clear
	 * @param {string} $key1 The name of the first key in the configuration path
	 * @param {string} $key2 Optional. The name of the second key in the configuration path.
	 *  You can actually pass as many keys as you need,
	 *  delving deeper and deeper into the configuration structure.
	 *  All but the second-to-last parameter are interpreted as keys.
	 */
	function clear(
	 $key1)
	{
		if (!isset($key1)) {
			$this->parameters = self::$cache = array();
			return;
		}
		$args = func_get_args();
		$args_count = func_num_args();
		$result = & $this->parameters;
		for ($i = 0; $i < $args_count - 1; ++$i) {
			$key = $args[$i];
			if (! is_array($result) 
			 or !array_key_exists($key, $result)) {
				return false;
			}
			$result = & $result[$key];
		}
		// clear the final value
		$key = $args[$args_count - 1];
		if (isset($key)) {
			unset($result[$key]);
		} else {
			array_pop($result);
		}
	}
	
	/**
	 * Loads data from JSON found in a file
	 * @method load
	 * @param {string} $filename The filename of the file to load.
	 * @param {boolean} $ignoreCache=false
	 *  Defaults to false. If true, then this function ignores
	 *  the cached value, if any, and attempts to search
	 *  for the file. It will cache the new value.
	 * @return {boolean} Returns true if loaded, otherwise false.
	 * @throws {Q_Exception_InvalidInput}
	 */
	function load(
	 $filename,
	 $ignoreCache = false)
	{
		$filename2 = Q::realPath($filename, $ignoreCache);
		if (!$filename2) {
			return false;
		}
		
		$this->filename = $filename2;
		
		// if class cache is set - use it
		if (isset(self::$cache[$filename2])) {
			$this->merge(self::$cache[$filename2]);
			return true;
		}

		// check Q_Cache and if set - use it
		// update class cache as it is not set
		$arr = Q_Cache::get("Q_Tree\t$filename2");
		if (isset($arr)) {
			self::$cache[$filename2] = $arr;
			$this->merge($arr);
			return true;
		}

		/**
		 * @event Q/tree/load {before}
		 * @param {string} filename
		 * @return {array}
		 */
		$arr = Q::event('Q/tree/load', compact('filename'), 'before');
		if (!isset($arr)) {
			try {
				// get file contents, remove comments and parse
				$config = Q_Config::get('Q', 'tree', array());
				$json = Q::readFile($filename2, Q::take($config, array(
					'ignoreCache' => true,
					'dontCache' => true,
					'duration' => 3600
				)));
				$json = preg_replace('/\s*(?!<\")\/\*[^\*]+\*\/(?!\")\s*/', '', $json);
				$arr = Q::json_decode($json, true);
			} catch (Exception $e) {
				$arr = null;
			}
		}
		if (!isset($arr)) {
			throw new Q_Exception_InvalidInput(array('source' => $filename));
		}
		if (!is_array($arr)) {
			return false;
		}
		// $arr was loaded from $filename2 or by Q/tree/load before event
		$this->merge($arr);
		self::$cache[$filename2] = $arr;
		Q_Cache::set("Q_Tree\t$filename2", $arr); // no need to check result - on failure Q_Cache is disabled
		return true;
	}
	
	/**
	 * Saves parameters to a file
	 * @method save
	 * @param {string} $filename Name of file to save to. If tree was loaded, you can leave this blank to update that file.
	 * @param {array} [$array_path=array()] Array of keys identifying the path of the config subtree to save
	 * @return {boolean} Returns true if saved, otherwise false;
	 **/
	function save (
		$filename = null, 
		$array_path = array(),
		$prefix_path = null)
	{
		if (empty($filename) and !empty($this->filename)) {
			$filename = $this->filename;
		}
		if (!($filename2 = Q::realPath($filename))) {
			$filename2 = $filename;
		}

		if (empty($array_path)) {
			$array_path = array();
			$toSave = $this->parameters;
		} else {
			$array_path[] = null;
			$toSave = call_user_func_array(array($this, 'get'), $array_path);
		}

		if(is_null($prefix_path)) {
			$prefix_path = $array_path;
		}

		$prefix_path = array_reverse($prefix_path);

		foreach($prefix_path as $ap) {
			if($ap) {
				$toSave = array($ap=>$toSave);
			}
		}

		$mask = umask(Q_Config::get('Q', 'internal','umask' , 0000));
		$success = file_put_contents(
			$filename2, 
			!empty($toSave) 
				? Q::json_encode($toSave, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
				: '{}',
			LOCK_EX);
		clearstatcache(true, $filename2);

		umask($mask);

		if ($success) {
			self::$cache[$filename] = $toSave;
			Q_Cache::set("Q_Tree\t$filename", $toSave); // no need to check result - on failure Q_Cache is disabled
		}
		return $success;
	}
	
	/**
	 * Merges trees over the top of existing trees
	 * @method merge
	 * @param {array|Q_Tree} $second The array or Q_Tree to merge on top of the existing one
	 * @return {boolean}
	 */
	function merge ($second)
	{
		if (is_array($second)) {
			$this->parameters = self::merge_internal($this->parameters, 
				$second);
			return true;
		} else if ($second instanceof Q_Tree) {
			$this->parameters = self::merge_internal($this->parameters, 
				$second->parameters);
			return true;
		} else {
			return false;
		}
	}
	
	/**
	 * Gets the value of a field in the tree. If it is null or not set,
	 * throws an exception. Otherwise, it is guaranteed to return a non-null value.
	 * @method expect
	 * @static
	 * @param {string} $key1 The name of the first key in the tree path
	 * @param {string} $key2 Optional. The name of the second key in the tree path.
	 *  You can actually pass as many keys as you need,
	 *  delving deeper and deeper into the expect structure.
	 *  All but the second-to-last parameter are interpreted as keys.
	 * @return {mixed} Only returns non-null values
	 * @throws {Q_Exception_MissingConfig} May throw an exception if the field is missing in the tree.
	 */
	function expect(
		$key1)
	{
		$args = func_get_args();
		$args2 = array_merge($args, array(null));
		$result = call_user_func_array(array($this, 'get'), $args2);
		if (!isset($result)) {
			throw new Q_Exception_MissingConfig(array(
				'fieldpath' => '"' . implode('"/"', $args) . '"'
			));
		}
		return $result;
	}
	
	/*
	 * We consider array1/array2 to be arrays. no scalars shall be passes
	 * @method merge_internal
	 * @static
	 * @protected
	 * @param {array} [$array1=array()]
	 * @param {array} [$array2=array()]
	 * $return {array}
	 */
	protected static function merge_internal ($array1 = array(), $array2 = array())
	{
		$first_is_json_array = $second_is_json_array = true;
		foreach ($array1 as $key => $value) {
			if (!is_int($key)) {
				$first_is_json_array = false;
				break;
			}
		}
		if ($first_is_json_array and isset($array2['replace'])) {
			return $array2['replace'];
		}
		foreach ($array2 as $key => $value) {
			if (!is_int($key)) {
				$second_is_json_array = false;
				break;
			}
		}
		$result = $array1;
		foreach ($array2 as $key => $value) {
			if ($second_is_json_array) {
				// merge in values if they are not in array yet
				// if array contains scalar values only unique values are kept
				if (!in_array($value, $result)) {
					// numeric key, just insert anyway, might be diff
					// resulting key in the result
					$result[] = $value;
				}
			} else if (array_key_exists($key, $result)) {
				if (is_array($value) and is_array($result[$key])) {
					// key already in result and both values are arrays
					$result[$key] = self::merge_internal($result[$key], $value);
				} else {
					// key already in result but one of the values is a scalar
					$result[$key] = $value;
				}
			} else {
				// key is not in result so just add it
				$result[$key] = $value;
			}
		}
		return $result;
	}
	
	public $filename = null;
	
	/**
	 * @property $parameters
	 * @type array
	 * @protected
	 */
	protected $parameters = array();
	/**
	 * @property $cache
	 * @static
	 * @type array
	 * @protected
	 */
	protected static $cache = array();
}
