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
		self::$namespace = defined('APP_DIR') ? APP_DIR : '';
		self::$apc = extension_loaded('apc');
		self::$apcu = extension_loaded('apcu')
			|| (is_callable('apcu_enabled') ? apcu_enabled() : false);
		self::$stores[self::$namespace] = array();
		self::$durations[self::$namespace] = array();
		self::$changed[self::$namespace] = array();
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
	 * Schedules a Q_Cache entry to be stored, but doesn't save it right away.
	 * You have to call Q_Cache::save() or wait until the script ends.
	 * @method set
	 * @static
	 * @param {string} $key The key of cache entry
	 * @param {mixed} $value The value to set in cache
	 * @param {integer} [$duration] How many seconds to store it for.
	 *   Defaults to duration from config "Q"/"cache"/"durations"
	 * @return {boolean} Whether cache was fetched (if not, it will attempt to be saved at script shutdown)
	 */
	static function set($key, $value, $duration = null) {
		if (!isset($duration)) {
			$duration = Q_Config::get('Q', 'cache', 'duration', 600);
		}
		$store = &self::fetchStore($fetched);
		$store[$key] = $value;
		self::$durations[self::$namespace][$key] = $duration;
		self::$changed[self::$namespace][$key] = true; // it will be saved at shutdown
		return $fetched;
	}

	/**
	 * Check if a Q_Cache entry exists
	 * @method exists
	 * @static
	 * @param {string} $key The key of cache entry
	 * @return {boolean} Whether it exists
	 */
	static function exists($key)
	{
		if (self::$ignore) {
			return false;
		}
		$name = "Q_Cache\t".self::$namespace."\t$key";
		if (is_callable('apcu_fetch')) {
			$store = apcu_fetch($name, $fetched);
		} else if (is_callable('apc_fetch')) {
			$store = apc_fetch($name, $fetched);
		} else {
			$store = array_key_exists($key, $store);
		}
		$store = self::fetchStore();
		return array_key_exists($key, $store);
	}

	/**
	 * Get Q_Cache entry
	 * @method get
	 * @static
	 * @param {string} $key The key of cache entry
	 * @param {mixed} [$default=null] In case the entry isn't there
	 * @return {mixed} The value of Q_Cache entry, or null on failure
	 */
	static function get($key, $default = null, &$fetched = null)
	{
		if (self::$ignore) {
			return $default;
		}
		$store = self::fetchStore();
		if (!array_key_exists($key, $store)) {
			$name = "Q_Cache\t".self::$namespace."\t$key";
			$fetched = false;
			if (is_callable('apcu_fetch')) {
				$value = apcu_fetch($name, $fetched);
			} else if (is_callable('apc_fetch')) {
				$value = apc_fetch($name, $fetched);
			}
			$store[$key] = $fetched ? $value : $default; // no such $key is stored in cache
		}
		return $store[$key];
	}

	/**
	 * Clear Q_Cache entry
	 * @method clear
	 * @static
	 * @param {string|true} $key The key of cache entry. Skip this to clear all the keys.
	 *   Pass true to also clear the entire cache, for all namespaces / apps.
	 * @param {boolean} [$prefix=false] Whether to clear all keys for which $key is a prefix
	 * @return {boolean} Whether an apc cache was fetched.
	 */
	static function clear($key, $prefix = false)
	{
		$namespace = self::$namespace;
		$store = self::fetchStore($fetched);
		if (!isset($key) or $key === true) {
			if ($key === true) {
				if (is_callable('apcu_clear_cache')) {
					apcu_clear_cache();
				} else if (is_callable('apc_clear_cache')) {
					apc_clear_cache('user');
				}
			}
			$store = array();
			if (is_callable('opcode_reset')) {
				opcache_reset(); // also reset all the PHP cached files
			}
			return $store;
		}
		if (array_key_exists($key, $store)) {
			if ($prefix) {
				$len = strlen($key);
				foreach ($store as $k => $v) {
					if (substr($k, 0, $len) === $key) {
						unset($store[$k]);
					}
				}
			} else {
				unset($store[$key]);
			}
			self::$changed[$namespace][$key] = true; // it will be saved at shutdown
		}
		return $fetched;
	}

	/**
	 * Fetches the cache store from APC.
	 * In either case, prepares self::$stores[$namespace] to be used as an array.
	 * @method fetchStore
	 * @protected
	 * @static
	 * @param {boolean} [$fetched] If passed, this is filled with whether the store was fetched
	 * @return {array} A reference to the cache store, or to an empty array if nothing was fetched
	 */
	protected static function &fetchStore(&$fetched = null)
	{
		if (!isset(self::$stores[self::$namespace])) {
			return self::$stores[self::$namespace] = array();
		}
		return self::$stores[self::$namespace];
	}

	/**
	 * This is called automatically during PHP shutdown,
	 * but you might choose to call it earlier, to flush any changes
	 * to the cache's storage.
	 * @method save
	 * @static
	 */
	static function save()
	{
		if (!self::$apc and !self::$apcu) {
			return;
		}
		$d = Q_Config::get('Q', 'cache', 'duration', 0);
		foreach (self::$changed as $namespace => $changed) {
			foreach (self::$changed[$namespace] as $key => $value) {
				$name = "Q_Cache\t$namespace\t$key";
				$duration = Q::ifset(self::$durations, $key, $d);
				if (is_callable('apcu_store')) {
					$success = apcu_store($name, self::$stores[$namespace][$key], $duration);
				} else if (is_callable('apc_store')) {
					$success = apc_store($name, self::$stores[$namespace][$key], $duration);
				}
			}
		}
		self::$changed = array();
	}
	
	/**
	 * @method shutdownFunction
	 * @static
	 */
	static function shutdownFunction()
	{
		self::save();
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
	protected static $stores = array();
	/**
	 * @property $durations
	 * @protected
	 * @type array
	 */
	protected static $durations = array();
	/**
	 * @property $changed
	 * @protected
	 * @type array
	 */
	protected static $changed = array();
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