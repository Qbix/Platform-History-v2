<?php

/**
 * @module Q
 */
/**
 * Used to maintain arbitrary data in persistent cache storage
 * @class Q_Cache
 */
class Q_Cache
{
	/**
	 * @method init
	 * @static
	 */
	static function init() {
		Q_Cache::$namespace = "Q_Cache\t".(defined('APP_DIR') ? APP_DIR : '');
		self::$apc = extension_loaded('apc');
		self::$apcu = extension_loaded('apcu');
	}
	
	/**
	 * Check if Q_Cache is connected to some PHP cache engine (currently APC)
	 * @method connected
	 * @static
	 * @return {boolean} Whether cache is currently connected
	 */
	static function connected() {
		return self::$apc or self::$apcu;
	}
	
	/**
	 * Can be used to ignore the cache for a while, to re-populate it
	 * @method ignore
	 * @static
	 * @param {boolean} $setting Whether to start or to stop ignoring the cache during Q_Cache::get
	 * @return {boolean} Returns the old setting
	 */
	static function ignore($setting)
	{
		$old_setting = self::$ignore;
		self::$ignore = $setting;
		return $old_setting;
	}

	/**
	 * Set Q_Cache entry
	 * @method set
	 * @static
	 * @param {string} $key The key of cache entry
	 * @param {mixed} $value The value to set in cache
	 * @param {string} [$namespace=self::$namespace] The namespace to use
	 * @return {boolean} Whether cache was fetched (if not, it will attempt to be saved at script shutdown)
	 */
	static function set($key, $value, $namespace = null) {
		if (!isset($namespace)) {
			$namespace = self::$namespace;
		}
		$store = self::fetchStore($namespace, $fetched);
		$store[$key] = $value;
		self::$changed[$namespace] = true; // it will be saved at shutdown
		return $fetched;
	}

	/**
	 * Check if a Q_Cache entry exists
	 * @method exists
	 * @static
	 * @param {string} $key The key of cache entry
	 * @param {string} [$namespace=self::$namespace] The namespace to use
	 * @return {boolean} Whether it exists
	 */
	static function exists($key, $namespace = null)
	{
		if (!isset($namespace)) {
			$namespace = self::$namespace;
		}
		if (self::$ignore) {
			return false;
		}
		$store = self::fetchStore($namespace);
		return array_key_exists($key, $store);
	}

	/**
	 * Get Q_Cache entry
	 * @method get
	 * @static
	 * @param {string} $key The key of cache entry
	 * @param {mixed} [$default=null] In case the entry isn't there
	 * @param {string} [$namespace=self::$namespace] The namespace to use
	 * @return {mixed} The value of Q_Cache entry, or null on failure
	 */
	static function get($key, $default = null, $namespace = null)
	{
		if (!isset($namespace)) {
			$namespace = self::$namespace;
		}
		$success = false;
		if (self::$ignore) {
			return $default;
		}
		$store = self::fetchStore($namespace);
		if (!array_key_exists($key, $store)) {
			return $default; // no such $key is stored in cache
		}
		return $store[$key];
	}

	/**
	 * Clear Q_Cache entry
	 * @method clear
	 * @static
	 * @param {string|true} $key The key of cache entry. Skip this to clear all the keys.
	 *   Pass true to also clear the user files cache.
	 * @param {boolean} [$prefix=false] Whether to clear all keys for which $key is a prefix
	 * @param {string} [$namespace=self::$namespace] The namespace to use
	 * @return {boolean} Whether an apc cache was fetched.
	 */
	static function clear($key, $prefix = false, $namespace = null)
	{
		if (!isset($namespace)) {
			$namespace = self::$namespace;
		}
		$store = self::fetchStore($namespace, $fetched);
		if (!isset($key) or $key === true) {
			$store = array();
			self::$changed[$namespace] = true; // it will be saved at shutdown
			if ($key === true) {
				if (is_callable('apcu_clear_cache')) {
					apcu_clear_cache();
				} else if (is_callable('apc_clear_cache')) {
					apc_clear_cache('user');
				}
			}
			return $store;
		}
		if (array_key_exists($key, $store)) {
			if ($prefix) {
				$len = strlen($key);
				foreach ($store as $k => $v) {
					if (substr($k, 0, $len) === $key) {
						unset($store[$namespace][$k]);
					}
				}
			} else {
				unset($store[$key]);
			}
			self::$changed[$namespace] = true; // it will be saved at shutdown
		}
		return $fetched;
	}

	/**
	 * Fetches the cache store from APC.
	 * In either case, prepares self::$store[$namespace] to be used as an array.
	 * @method fetchStore
	 * @protected
	 * @static
	 * @param {string} [$namespace=self::$namespace] The namespace to use
	 * @param {boolean} [$fetched] If passed, this is filled with whether the store was fetched
	 * @return {array} A reference to the cache store, or to an empty array if nothing was fetched
	 */
	protected static function &fetchStore($namespace = null, &$fetched = null)
	{
		if (!isset($namespace)) {
			$namespace = self::$namespace;
		}
		$namespace = "Q_Cache\t".$namespace;
		if (!self::$apc and !self::$apcu) {
			$fetched = false;
			self::$store[$namespace] = array();
		} else {
			if (is_callable('apcu_fetch')) {
				$store = apcu_fetch($namespace, $fetched);
			} else {
				$store = apc_fetch($namespace, $fetched);
			}
            self::$store[$namespace] = $fetched ? $store : array();
        }
		return self::$store[$namespace];
	}

	/**
	 * Set the duration for a given cache store. The default is in Q/cache/duration config.
	 * @method setDuration
	 * @protected
	 * @static
	 * @param {integer} $duration The number of seconds to store until the cache under this namespace expires
	 * @param {string} [$namespace=self::$namespace] The namespace to use
	 */
	public static function setDuration($duration, $namespace = null)
	{
		if (!isset($namespace)) {
			$namespace = self::$namespace;
		}
		self::$durations[$namespace] = $duration;
	}
	
	/**
	 * @method shutdownFunction
	 * @static
	 */
	static function shutdownFunction()
	{
		if (!self::$apc and !self::$apcu) {
			return;
		}
		foreach (self::$changed as $namespace => $changed) {
			$namespace = "Q_Cache\t".$namespace;
			self::set("Q_Cache\tupdateTime", time());
			$duration = Q_Config::get('Q', 'cache', 'duration', 0);
			$duration = Q::ifset(self::$durations, $namespace, $duration);
			if (is_callable('apcu_store')) {
				apcu_store($namespace, self::$store[$namespace], $duration);
			} else if (is_callable('apc_store')) {
				apc_store($namespace, self::$store[$namespace], $duration);
			}
		}
	}

	/**
	 * @property $ignore
	 * @protected
	 * @type boolean
	 */
	protected static $ignore = false;
	/**
	 * @property $store
	 * @protected
	 * @type array
	 */
	protected static $store = null;
	/**
	 * @property $changed
	 * @protected
	 * @type array
	 */
	protected static $changed = array();
	/**
	 * @property $durations
	 * @protected
	 * @type array
	 */
	protected static $durations = array();
	/**
	 * @property $namespace
	 * @protected
	 * @type string
	 */
	protected static $namespace;
	/**
	 * @property $apc
	 * @protected
	 * @type boolean
	 */
	protected static $apc;
	/**
	 * @property $apcu
	 * @protected
	 * @type boolean
	 */
	protected static $apcu;
}

Q_Cache::init();