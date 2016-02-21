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
		Q_Cache::$namespace = "Q_Cache\t".(defined('APP_DIR') ? APP_DIR : '')."\t";
		self::$apc = extension_loaded('apc');
	}
	
	/**
	 * Check if Q_Cache is connected to some PHP cache engine (currently APC)
	 * @method connected
	 * @static
	 * @return {boolean} Whether cache is currently connected
	 */
	static function connected() {
		return self::$apc;
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
	 * @return {boolean} Whether cache was fetched (if not, it will attempt to be saved at script shutdown)
	 */
	static function set($key, $value) {
		$loaded = self::fetchStore();
		self::$store[$key] = $value;
		self::$changed = true; // it will be saved at shutdown
		return $loaded;
	}

	/**
	 * Get Q_Cache entry
	 * @method get
	 * @static
	 * @param {string} $key The key of cache entry
	 * @return {mixed} The value of Q_Cache entry, or null on failure
	 */
	static function get($key)
	{
		$success = false;
		if (self::$ignore) {
			return null;
		}
		self::fetchStore();
		if (!array_key_exists($key, self::$store)) {
			return null; // no such $key is stored in cache
		}
		$success = true;
		return self::$store[$key];
	}

	/**
	 * Clear Q_Cache entry
	 * @method clear
	 * @static
	 * @param {string} $key The key of cache entry
	 * @param {boolean} [$prefix=false] Whether to clear all keys for which $key is a prefix
	 * @return {boolean} Whether an apc cache was fetched.
	 */
	static function clear($key, $prefix = false)
	{
		$fetched = self::fetchStore();
		if (!isset($key)) {
			self::$store = array();
			self::$changed = true; // it will be saved at shutdown
			return $fetched;
		}
		if (array_key_exists($key, self::$store)) {
			if ($prefix) {
				$len = strlen($key);
				foreach (self::$store as $k => $v) {
					if (substr($k, 0, $len) === $key) {
						unset(self::$store[$k]);
					}
				}
			} else {
				unset(self::$store[$key]);
			}
			self::$changed = true; // it will be saved at shutdown
		}
		return $fetched;
	}

	/**
	 * Fetches the cache store from APC.
	 * In either case, prepares `self::$store` to be used as an array.
	 * @method fetchStore
	 * @protected
	 * @static
	 * @return {boolean} Whether the cache store was fetched.
	 */
	protected static function fetchStore()
	{
		static $fetched = null;
		if (isset($fetched)) {
			return $fetched; // return previous result
		}
		if (!self::$apc) {
			$fetched = false;
			self::$store = array();
			return false;
		} else {
            $store = apc_fetch(self::$namespace, $fetched);
            self::$store = $fetched ? $store : array();
            return $fetched;
        }
	}
	
	/**
	 * @method shutdownFunction
	 * @static
	 */
	static function shutdownFunction()
	{
		if (self::$changed and self::$apc) {
			self::set("Q_Config\tupdateTime", time());
			apc_store(self::$namespace, self::$store);
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
	 * @type boolean
	 */
	protected static $changed = false;
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
}

Q_Cache::init();