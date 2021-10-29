<?php

/**
 * @module Q
 */
class Q_Uri
{
	/**
	 * Represents an internal URI
	 * @class Q_Uri
	 * @constructor
	 */
	protected function __construct()
	{
	}
	
	/**
	 * Constructs a URI object from something
	 * @method from
	 * @static
	 * @param {string} $source An absolute URL, or an array, or a URI in string form.
	 * @param {string} [$route=null] The pattern of the route in the routes config.
	 *  If not specified, then Qbix searches all the route patterns in order, until it finds one that fits.
	 *  If you set this to false, then $source is treated as an absolute URL, regardless of its format.
	 * @return {Q_Uri|false} Returns false if no route patterns match.
	 *  Otherwise, returns the URI.
	 */
	static function from(
	 $source,
	 $route = null)
	{

		if (empty($source)) {
			return null;
		}
		
		if ($route === false) {
			$u = new Q_Uri();
			$u->Q_url = $source;
			return $u;
		}
			
		if (is_array($source)) {
			return self::fromArray($source);
		}
		
		if (is_string($source)) {
			if (Q_Valid::url($source)) {
				return self::fromUrl($source, $route);
			} else {
				return self::fromString($source);
			}
		}
		
		if ($source instanceof Q_Uri) {
			$source2 = clone $source;
			return $source2;
		}
	}
	
	/**
	 * @method __toString
	 * @return {string}
	 */
	function __toString()
	{
		if (!empty($this->Q_url)) {
			return $this->Q_url;
		}
		
		// returns it as a string
		$module = isset($this->fields['module']) ? $this->fields['module'] : null;
		$action = isset($this->fields['action']) ? $this->fields['action'] : null;
		$result = "$module/$action";
		if ($this->querystring) {
			$result .= '?'.$this->querystring;
		}
		if ($this->anchorstring) {
			$result .= '#'.$this->anchorstring;
		}
		$other_fields = array();
		foreach ($this->fields as $name => $value) {
			if (is_numeric($name) 
			 or $name == 'action' 
			 or $name == 'module') {
				continue;
			}
			$other_fields[$name] = $value;
		}
		if (!empty($other_fields)) {
			$result .= " " . self::encode($other_fields);
		}
		return $result;
	}
	
	/**
	 * @method toArray
	 * @return {array}
	 */
	function toArray()
	{
		// returns it as an array
		$result = $this->fields;
		if ($this->querystring) {
			$result['?'] = $this->querystring;
		}
		if ($this->anchorstring) {
			$result['#'] = $this->anchorstring;
		}
		return $result;
	}
	
	/**
	 * Takes some input and returns the corresponding URL
	 * @method url
	 * @static
	 * @param {string|boolean|array|Q_Uri} $source This can be a Q_Uri, an array or string representing a uri,
	 *  an absolute url, or "true". If you pass "true", then the Q_Request::baseUrl(true) is used as input.
	 * @param {string|null} [$route=null] If you know which route pattern to use, then specify it here. Otherwise, leave it null.
	 * @param {boolean} [$noProxy=false] If set to true, Q_Uri::proxySource($url) is not called before returning the result.
	 * @param {string} [$controller=true] The controller to pass to `Q_Request::baseUrl($controller)` when forming the URL.
	 * @return {string}
	 */
	static function url(
	 $source,
	 $route = null,
	 $noProxy = false,
	 $controller = true)
	{
		if (empty($source)) {
			return $source;
		}
		if ($source === true) {
			$source = Q_Request::baseUrl($controller);
		}

		if (($source instanceof Q_Uri) and $source->Q_url) {
			return Q_Uri::fixUrl($source->Q_url);
		}
		
		static $cache = array();
		$cache_key = $noProxy ? $source . "\tnoProxy" : $source;
		if (is_string($source) and isset($cache[$cache_key])) {
			return Q_Uri::fixUrl($cache[$cache_key]);
		}
		
		if (is_string($source) and isset($source[0]) and $source[0] == '#') {
			// $source is a fragment reference
			return Q_Uri::fixUrl($source);
		}
		
		if (Q_Valid::url($source)) {
			// $source is already a URL
			$result = $noProxy ? $source : self::proxySource($source);
			if (is_string($source)) {
				$cache[$source] = $result;
			}
			return Q_Uri::fixUrl($result);
		}
		
		$uri = self::from($source);
		if (!$uri) {
			$url = null;
		} else { 
			if ($controller === true) {
				// If developer set a custom controller, calculate it.
				$cs = Q_Config::get('Q', 'web', 'controllerSuffix', null);
				if (isset($cs)) {
					$controller = $cs;
				}
			}
			$url = $uri->toUrl($route, $controller);
		}
		if (!isset($url)) {
			$hash = Q_Uri::unreachableUri();
			if ($hash) {
				$result = $hash;
				if (is_string($source)) {
					$cache[$source] = $result;
				}
				return $result;
			}
		}
		if ($noProxy) {
			$result = $url;
			if (is_string($source)) {
				$cache[$source] = $result;
			}
			return $result;
		}
		$result = self::proxySource($url);
		if (is_string($source)) {
			$cache[$source] = $result;
		}
		return Q_Uri::fixUrl($result);
	}

	static function unreachableUri()
	{
		return Q_Config::get('Q', 'uri', 'unreachableUri', '#_noRouteToUri');
	}
	
	/**
	 * Adds cache busting to a url
	 * @param {string} $url A string to replace the default base url
	 * @param {integer} $milliseconds Number of milliseconds before a new cachebuster code is appended
	 */
	static function cacheBust($url, $milliseconds)
	{
		return Q_Uri::url("$url?Q.cacheBust=".floor(microtime(true)*1000/$milliseconds));
	}
	
	/**
	 * Set a suffix for all URLs that will be generated with this class.
	 * @method suffix
	 * @static
	 * @param {array|string} [$suffix=null] If no arguments are passed, just returns the current suffix.
	 *  Pass an array here. For each entry, the key is tested and if it
	 *  begins the URL, then the value is appended.
	 *  Suffixes are applied when URLs are generated.
	 *  You can also pass a string here, in which case the array('' => $suffix) is used.
	 * @return {array} Returns the suffix at the time the function was called.
	 */
	static function suffix($suffix = null)
	{
		if (is_string($suffix)) {
			$suffix = array('' => $suffix);
		}
		if (!isset($suffix)) {
			return isset(self::$suffix) ? self::$suffix : array();
		}
		$prev_suffix = self::$suffix;
		self::$suffix = $suffix;
		return $prev_suffix;
	}
	
	/**
	 * Set cache base url, relative to which this particular client may store cached
	 * versions of files.
	 * @method cacheBaseUrl
	 * @static
	 * @param {array} [$base_url=null] If no arguments are passed, just returns the current cache base url.
	 * @return {array} Returns the cache base url at the time the function was called.
	 */
	static function cacheBaseUrl($base_url = null)
	{
		if (!isset($base_url)) {
			return isset(self::$cacheBaseUrl) ? self::$cacheBaseUrl : array();
		}
		$prev_base_url = self::$cacheBaseUrl;
		self::$cacheBaseUrl = $base_url;
		return $prev_base_url;
	}
	
	/**
	 * Get the base url of a plugin
	 * @method pluginBaseUrl
	 * @static
	 * @param string $plugin The name of the plugin, with first letter uppercase.
	 * @return {string} Returns an absolute or relative URL
	 */
	static function pluginBaseUrl($plugin)
	{
		/**
		 * Hook for custom logic modifying the urls for a plugin
		 * @event Q/Uri/pluginUrl {before}
		 * @param {string} plugin
		 * @return {string}
		 */
		if ($url = Q::event('Q/Uri/pluginUrl', @compact('url'), 'before')) {
			return;
		}
		return "Q/plugins/$plugin";
	}
	
	/**
	 * Returns the value of the specified URI field, or null
	 * if it is not present.
	 * @method __get
	 * @param {string} $field_name The name of the field.
	 * @return {string|null} Returns the value of the field, or null if not there.
	 */
	function __get($field_name)
	{
		if (isset($this->fields[$field_name])) {
			return $this->fields[$field_name];
		}
		return null;
	}
	
	/**
	 * Sets the value of the specified URI field
	 * @method __set
	 * @param {string} $field_name The name of the field.
	 * @param {string|array} $value The value of the field
	 */
	function __set($field_name, $value)
	{
		if (is_array($value)) {
			$this->fields[$field_name] = $value;
		} else {
			$this->fields[$field_name] = (string)$value;
		}
	}
	
	/**
	 * Returns whether the specified URI field is set
	 * @method __isset
	 * @param {string} $field_name The name of the field.
	 */
	function __isset($field_name)
	{
		return isset($this->fields[$field_name]);
	}

	/**
	 * Get the routes that should be tried in the order returned.
	 * Merges routes from Q/routes@start, Q/routes and Q/routes@end.
	 * Within each one, routes are sorted in reverse order,
	 * so that later plugins can override earlier ones.
	 * The earlier plugins can use "routes@start" and "routes@end"
	 * to declare the priority of their routes.
	 * @return {array} The array of $route => $info pairs.
	 */
	static function getRoutes()
	{
		$config = Q_Config::get('Q', array());
		$routesStart = Q::reverseOrder(Q::ifset($config, 'routes@start', array()));
		$routes = Q::reverseOrder(Q::ifset($config, 'routes', array()));
		$routesEnd = Q::reverseOrder(Q::ifset($config, 'routes@end', array()));
		$result = array();
		foreach (array($routesStart, $routes, $routesEnd) as $source) {
			foreach ($source as $k => $v) {
				if (!isset($result[$k])) {
					$result[$k] = $v;
				}
			}
		}
		return $result;
	}
	
	//
	// Internal
	//
	
	/**
	 * @method fromUrl
	 * @static
	 * @protected
	 * @param {string} $url
	 * @param {string} [$route=null]
	 * @return {Q_Uri}
	 * @throws {Q_Exception_BadUrl}
	 * @throws {Q_Exception_MissingRoute}
	 */
	protected static function fromUrl(
	 $url,
	 $route = null)
	{
		if (empty($url)) {
			return null;
		}
		$url = Q_Uri::interpolateUrl($url);
			
		static $routed_cache = array();
		if (isset($routed_cache[$url])) {
			return $routed_cache[$url];
		}

		/**
		 * Hook for custom logic modifying routing from URLs to internal URIs
		 * @event Q/Uri/fromUrl {before}
		 * @param {string} url
		 * @return {Q_Uri}
		 */
		$uri = Q::event('Q/Uri/fromUrl', @compact('url'), 'before');
		if (isset($uri)) {
			$routed_cache[$url] = $uri;
			return $uri;
		}
		$routes = self::getRoutes();
		if (empty($routes)) {
			return self::fromArray(array(
				'module' => 'Q', 
				'action' => 'welcome'
			));
		}
		$base_url = Q_Request::baseUrl(true);

		$len = strlen($base_url);
		$head = substr($url, 0, $len);
		if ($head != $base_url) {
			// try applying proxies before giving up
			$dest_url = self::proxyDestination($url);
			$head = substr($dest_url, 0, $len);
			if ($head != $base_url) {
				// even the proxy destination doesn't match.
				throw new Q_Exception_BadUrl(@compact('base_url', 'url'));
			}
			$result = self::fromUrl($dest_url, $route);
			if (!empty($result)) {
				return $result;
			} else {
		    	throw new Q_Exception_BadUrl(@compact('base_url', 'url'));
			}
		}

		// Get the path within our app
		$tail = substr($url, strlen($head) + 1);
		$p = explode('#', $tail);
		$p2 = explode('?', $p[0]);
		$path = $p2[0];

		// Break it up into segments and try the routes
		$segments = $path ? explode('/', $path) : array();
		$uri_fields = null;

		if (substr($base_url, -11) === '/action.php') {
			if (count($segments) < 2) {
				return Q_Uri::fromArray(array());
			} else {
				return Q_Uri::fromArray(array(
					'module' => $segments[0],
					'action' => $segments[1]
				));
			}
		}

		if ($route) {
			if (! array_key_exists($route, $routes)) {
				throw new Q_Exception_MissingRoute(@compact('route'));
			}
			$uri_fields = self::matchSegments($route, $segments);
		} else {

			foreach ($routes as $pattern => $fields) {
				if (!isset($fields))
					continue; // this provides a way to disable a route via config
				$pattern2 = Q_Uri::interpolateUrl($pattern);
				$uri_fields = self::matchSegments($pattern2, $segments);
				if ($uri_fields !== false) {
					$matched = true;
					foreach ((array)$uri_fields as $k => $v) {
						if (isset($fields[$k])) {
							if (!preg_match($fields[$k], $v)) {
								$matched = false;
								break;
							}
						}
					}
					// If this route has a special condition, test it
					if (!empty($fields[''])) {
						$params = array(
							'uriFields' => $uri_fields,
							'routeFields' => $fields,
							'fields' => array_merge($fields, $uri_fields),
							'pattern' => $pattern,
							'fromUrl' => $url
						);
						if (false === Q::event($fields[''], $params, false, false, $params)) {
							$matched = false;
						}
					}
					if ($matched) {
						// If we are here, then the route has matched!
						$route = $pattern;
						break;
					}
				}
			}
		}
 
		if (!is_array($uri_fields)) {
			// No route has matched
			return self::fromArray(array());
		}
		
		// Now, fill in any extra fields, if present
		if (is_array($routes[$route])) {
			$uri_fields = array_merge($routes[$route], $uri_fields);
		}

		$uri = self::fromArray($uri_fields);
		if (isset($route)) {
			$uri->route = $route;
		}
		$routed_cache[$url] = $uri;
		return $uri;
	}

	/**
	 * Maps this URI into an external URL.
	 * @method toUrl
	 * @param {string} [$route=null] If you name the route to use for unrouting,
	 *  it will be used as much as possible.
	 *  Otherwise, Qbix will go through the routes one by one in order,
	 *  until it finds one that can route a URL to the full URI
	 *  contained in this object.
	 * @param {string} [$controller=true] You can supply a different controller name, like 'tool.php'
	 * @return {string} If a $route is specified, the router uses this route 
	 *  and replaces as many variables as it can to match the $internal_destination. 
	 *  If not, the router tries to find a route and use it to 
	 *  make an external URL that maps to the internal destination
	 *  exactly, but if none of the routes can do this, it returns 
	 *  an empty string.
	 *  You may want to use Q_Uri::proxySource() on the returned url to get
	 *  the proxy url corresponding to it.
	 */
	function toUrl(
	 $route = null,
	 $controller = true)
	{
		if (!empty($this->Q_url)) {
			return $this->Q_url;
		}
		
		if (empty($this->fields)) {
			return null;
		}
		
		$routes = self::getRoutes();
		if (empty($routes)) {
			$url = Q_Request::baseUrl($controller);
		} else if ($route) {
			if (!isset($routes[$route])) {
				$url = null;
			} else {
				$url = self::matchRoute($route, $routes[$route], $controller);
			}
		} else {
			foreach ($routes as $pattern => $fields) {
				if (!isset($fields)) {
					continue;
				}

				if ($url = $this->matchRoute($pattern, $fields, $controller)) {
					break;
				}
			}
		}
		if ($url) {
			if ($this->querystring) {
				$url .= '?'.$this->querystring;
			}
			if ($this->anchorstring) {
				$url .= '#'.$this->anchorstring;
			}
			$suffix = self::suffix();
			if (is_string($suffix)) {
				$url .= self::suffix();
			} else {
				// aggregate suffixes
				foreach ($suffix as $k => $v) {
					$k_len = strlen($k);
					if (substr($url, 0, $k_len) === $k) {
						$url .= $v;
					}
				}
			}
			$route = $pattern;
		}
		
		/**
		 * @event Q/Uri/toUrl {before}
		 * @param {Q_Uri} uri This is the uri being turned into a URL
		 * @param {string|null} route The route that is going to be used (from config)
		 * @param {string|null} controller The controller that is being used for the baseUrl
		 * @param {string|null} url The computed url, that will be returned. You can modify it.
		 * @return {string}
		 */
		$uri = $this;
		$params = @compact('uri', 'route', 'pattern', 'controller', 'url');
		$params['url'] = &$url;
		Q::event('Q/Uri/toUrl', $params, 'before', false, $url);
		
		if ($url) {
			return self::fixUrl($url);
		}
				
		return null;
	}
	
	/**
	 * Get the route that was used to obtain this URI from a URL
	 * @method route
	 * @return {string}
	 */
	function route()
	{
		return $this->route;
	}
	
	/**
	 * @method matchSegments
	 * @static
	 * @protected
	 * @param {string} $pattern The pattern (of the rule) to match
	 * @param {string} $segments The segments extracted from the URL
	 * @return {array|false} Returns false if one of the literal values doesn't match up,
	 *  Otherwise, returns array of field => name pairs
	 *  where fields were filled.
	 */
	protected static function matchSegments($pattern, $segments)
	{
		$route_segments = $pattern ? explode('/', $pattern) : array();
		$tail_array = false;
		if (substr($pattern, -2) === '[]') {
			$tail_array = true;
			$last_rs = end($route_segments);
			if (!in_array($last_rs[0], self::$variablePrefixes)) {
				return false;
			}
			$route_segments = array_slice($route_segments, 0, -1);
		}
		$count = count($route_segments);
		$segments_count = count($segments);
		if ($tail_array) {
			if ($count >= $segments_count) {
				return false; // rule does not match
			}
		} else {
			if ($count != $segments_count) {
				return false; // rule does not match
			}
		}
		// Segments matching test
		$args = array();
		for ($i = 0; $i < $count; ++ $i) {
			$rs = $route_segments[$i];
			$rs_parts = explode('.', $rs);
			$rs_parts_count = count($rs_parts);
			$segment = urldecode($segments[$i]);
			$s_parts = explode('.', $segment, $rs_parts_count);
			$s_parts_count = count($s_parts);
			if ($s_parts_count < $rs_parts_count) {
				return false;
			}
			for ($j = 0; $j < $rs_parts_count; ++$j) {
				if (!isset($rs_parts[$j][0]) or !in_array($rs_parts[$j][0], self::$variablePrefixes)) {
					// literal value
					if ($s_parts[$j] !== str_replace(self::$escapedVariablePrefixes, self::$variablePrefixes, $rs_parts[$j])) {
						return false;
					}
					continue;
				}
				// otherwise, $variable
				$field_name = substr($rs_parts[$j], 1);
				$args[$field_name] = $s_parts[$j];
			}
		}
		
		if (!empty($last_rs)) {
			// Put the rest of the segments into an array
			$field_name = substr($last_rs, 1, -2);
			$args[$field_name] = array();
			while ($i < $segments_count) {
				$args[$field_name][] = urldecode($segments[$i]);
				++$i;
			}
		}

		return $args;
	}
	
	/**
	 * @method matchRoute
	 * @static
	 * @protected
	 * @param {string} $pattern
	 * @param {array} $fields
	 * @param {string} [$controller=true]
	 * @return {string|false} Returns false if even one field doesn't match.
	 *  Otherwise, returns the URL that would be routed to this uri.
	 */
	protected function matchRoute(
	 $pattern, 
	 $fields,
	 $controller = true)
	{
		// First, test if the URI satisfies the pattern
		$rsegments = explode('/', $pattern);
		if (substr($pattern, -2) === '[]') {
			$last_rs = end($rsegments);
			if (false === in_array($last_rs[0], self::$variablePrefixes)) {
				return false;
			}
			$rsegments = array_slice($rsegments, 0, -1);
		}
		$segments = array();
		$field_in_pattern = array();
		foreach ($rsegments as $rs) {			
			$rs_parts = explode('.', $rs);
			$rs_parts_count = count($rs_parts);
			$segment_parts = array();
			for ($j = 0; $j < $rs_parts_count; ++$j) {
				if (!isset($rs_parts[$j][0]) or (false === in_array($rs_parts[$j][0], self::$variablePrefixes))) {
					// literal value
					$segment_parts[] = urlencode(
						str_replace(self::$escapedVariablePrefixes, self::$variablePrefixes, $rs_parts[$j])
					);
					continue;
				}
				// otherwise, $variable
				$field_name = substr($rs_parts[$j], 1);
				if (!array_key_exists($field_name, $this->fields)) {
					return false;
				}
				if (is_array($this->fields[$field_name])) {
					return false; // arrays can only come at the end
				}
				$segment_parts[] = urlencode($this->fields[$field_name]);
				$field_in_pattern[$field_name] = true;
			}
			$segments[] = implode('.', $segment_parts);
		}
		
		// If pattern ends in [], process the last route segment
		if (!empty($last_rs)) {
			$field_name = substr($last_rs, 1, -2);
			if (!array_key_exists($field_name, $this->fields)) {
				return false;
			}
			if (is_string($this->fields[$field_name])) {
				$segments[] = urlencode($this->fields[$field_name]);
			} else {
				foreach ($this->fields[$field_name] as $f) {
					$segments[] = urlencode($f);
				}
			}
			$field_in_pattern[$field_name] = true;
		}

		// Then, test if all the fields match
		foreach ($fields as $name => $value) {
			if (!$name) {
				continue;
			}
			if (isset($field_in_pattern[$name])) {
				continue; // this is a regexp
			}
			if ((!isset($this->fields[$name])) or $this->fields[$name] != $value) {
				return false;
			}
		}

		// Test field matches the other way
		foreach ($this->fields as $name => $value) {
			if (!$name) {
				continue;
			}
			if (isset($field_in_pattern[$name])) {
				if (isset($fields[$name])) {
					if (!preg_match($fields[$name], $this->fields[$name])) {
						return false;
					}
				}
				continue;
			}
			if (!isset($fields[$name]) or $fields[$name] != $value) {
				return false;
			}
		}
		
		// If this route has a special condition, test it
		if (!empty($fields[''])) {
			$params = array(
				'fields' => $this->fields, 
				'pattern' => $pattern, 
				'controller' => $controller
			);
			if (false === Q::event($fields[''], $params)) {
				return false;
			}
		}
		$url = Q_Request::baseUrl($controller).'/'.implode('/', $segments);
		return $url;
	}
	
	/**
	 * If a proxy exists for this URL, returns the destination URL, otherwise returns the input URL
	 * @method proxyDestination
	 * @static
	 * @param {string} $url
	 * @return {string}
	 */
	static function proxyDestination($url)
	{
		$proxies = Q_Config::get('Q', 'proxies', array());
		foreach ($proxies as $dest_url => $src_url) {
			$src_url_strlen = strlen($src_url);
			if (substr($url, 0, $src_url_strlen) == $src_url) {
				if (!isset($url[$src_url_strlen]) 
				or $url[$src_url_strlen] == '/') {
					return $dest_url.substr($url, $src_url_strlen);
				}
			}
		}
		return $url;
	}
	
	/**
	 * If a proxy exists for this URL, returns the source URL, otherwise returns the input URL
	 * @method proxySource
	 * @static
	 * @param {string} $url
	 * @return {string}
	 */
	static function proxySource($url)
	{
		$url = self::fixUrl($url);
		$proxies = Q_Config::get('Q', 'proxies', array());
		foreach ($proxies as $dest_url => $src_url) {
			$dest_url_strlen = strlen($dest_url);
			if (substr($url, 0, $dest_url_strlen) == $dest_url) {
				if (!isset($url[$dest_url_strlen]) 
				or $url[$dest_url_strlen] == '/') {
					return $src_url.substr($url, $dest_url_strlen);
				}
			}
		}
		return $url;
	}
	
	/**
	 * @method documentRoot
	 * @static
	 * @return {string}
	 */
	static function documentRoot()
	{
		$docroot_dir = Q_Config::get('Q', 'docroot_dir', null);
		if (empty($docroot_dir))
			$docroot_dir = $_SERVER['DOCUMENT_ROOT'];
		$docroot_dir = str_replace("\\", '/', $docroot_dir);
		if (substr($docroot_dir, -1) == '/')
			$docroot_dir = substr($docroot_dir, 0, strlen($docroot_dir) - 1);
		return $docroot_dir;
	}
	
	/**
	 * Returns what the local filename of a local URL would typically be without any routing.
	 * If not found under docroot, also checks various aliases.
	 * @method filenamefromUrl
	 * @static
	 * @param {string} $url The url to translate, whether local or an absolute url beginning with the base URL
	 * @return {string} The complete filename of the file or directory.
	 *  It may not point to an actual file or directory, so use file_exists() or realpath()
	 */
	static function filenamefromUrl ($url)
	{
		if (Q_Valid::url($url)) {
			// This is an absolute URL. Get only the part after the base URL
			// Run it through proxies first
			$url = self::proxyDestination($url);
			$local_url = Q_Request::tail($url);
			if (!isset($local_url)) {
				return null;
			}
		} else {
			$local_url = $url;
		}
		$parts = explode('?', $local_url);
		$local_url = $parts[0];

		if ($local_url == '' || $local_url[0] != '/')
			$local_url = '/' . $local_url;

		// Try various aliases first
		$aliases = Q_Config::get('Q', 'aliases', array());
		foreach ($aliases as $alias => $path) {
			$alias_len = strlen($alias);
			if (substr($local_url, 0, $alias_len) == $alias) {
				return $path . substr($local_url, $alias_len);
			}
		}
		
		// Otherwise, we should use the document root.
		$docroot_dir = self::documentRoot();
		return $docroot_dir.$local_url;
	}
	
	/**
	 * Interpolate some standard placeholders inside a url, such as 
	 * {{AppName}} or {{PluginName}}
	 * @static
	 * @method interpolateUrl
	 * @param {string} $url
	 * @param {array} [$additional=array()] Any additional substitutions
	 * @return {strQ_Uri::interpolateUrlitutions applied
	 */
	static function interpolateUrl($url, $additional = array())
	{
		if (strpos($url, '{{') === false) {
			return $url;
		}
		$app = Q::app();
		$baseUrl = Q_Request::baseUrl();
		$substitutions = array(
			'baseUrl' => $baseUrl,
			$app => $baseUrl
		);
		$plugins = Q_Config::expect('Q', 'plugins');
		$plugins[] = 'Q';
		foreach ($plugins as $plugin) {
			$substitutions[$plugin] = Q_Uri::pluginBaseUrl($plugin);
		}
		$url = Q::interpolate($url, $substitutions);
		if ($additional) {
			$url = Q::interpolate($url, $additional);
		}
		return $url;
	}
	
	/**
	 * Interpolates a URL and fixes it to have only one question mark and hash mark.
	 * @method fixUrl
	 * @static
	 * @param {string} $url The url to fix
	 * @return {string} The URL with all subsequent ? and # replaced by &
	 */
	static function fixUrl($url)
	{
		$url = Q_Uri::interpolateUrl($url);
		$pieces = explode('?', $url);
		$url = $pieces[0];
		if (isset($pieces[1])) {
			$url .= '?' . implode('&', array_slice($pieces, 1));
		}
		$pieces = explode('#', $url);
		$url = $pieces[0];
		if (isset($pieces[1])) {
			$url .= '#' . implode('&', array_slice($pieces, 1));
		}
		return $url;
	}
	
	/**
	 * May append a "Q.cacheBust" parameter to URL's querystring, and also
	 * returns the content digest hash for that particular URL, 
	 * if it corresponds to a file processed by the urls.php script.
	 * This function is very useful to use with clients like PhoneGap which can
	 * intercept URLs and load whatever locally cached files are stored in their bundle.
	 * The urls for these files will be relative to the cache base url.
	 * (See Q_Uri::cacheBaseUrl function).
	 * In this case, the client is supposed to send the timestamp of when the
	 * cache it is using was generated.
	 * This function checks the current contents of the Q/config/Q/urls.php file,
	 * generated by scripts/Q/urls.php script.
	 * If the url's timestamp there is newer than the Q_Request::cacheTimestamp()
	 * (which the client can set by setting the 'Q_ct' field in the querystring)
	 * then that means the server has a newer version of the file, so the passed
	 * $url is used instead.
	 * Otherwise, the url relative to cacheBaseUrl is used, making the client
	 * load the locally cached version.
	 * @param {string} $url The url to get the cached URL and hash for
	 * @param {array} [$options=array()]
	 * @param {boolean} [$options.skipCacheBaseUrl=false] If true, skips the cacheBaseUrl transformations
	 * @return {array} array($urlWithCacheBust, $hash)
	 */
	static function cachedUrlAndHash($url, $options = array())
	{
		$cacheTimestamp = Q_Request::cacheTimestamp();
		$environment = Q_Config::get('Q', 'environment', '');
		$config = Q_Config::get('Q', 'environments', $environment, 'urls', array());
		if (empty(Q_Uri::$urls)) {
			return array($url, null);
		}
		$fileTimestamp = null;
		$fileSHA1 = null;
		if (!empty($config['caching']) or !empty($config['integrity'])) {
			$parts = explode('?', $url);
			$head = $parts[0];
			$tail = (count($parts) > 1 ? $parts[1] : '');
			$urlRelativeToBase = substr($head, strlen(Q_Request::baseUrl(false)));
			$parts = explode('/', $urlRelativeToBase);
			array_shift($parts);
			$parts[] = null;
			$tree = new Q_Tree(Q_Uri::$urls);
			$info = call_user_func_array(array($tree, 'get'), $parts);
			if (!empty($config['caching'])) {
				$fileTimestamp = Q::ifset($info, 't', null);
			}
			if (!empty($config['integrity'])) {
				$fileSHA1 = Q::ifset($info, 'h', null);
			}
		}
		if ($cacheTimestamp
		and isset($fileTimestamp)
		and $fileTimestamp <= $cacheTimestamp
		and self::$cacheBaseUrl) {
			return array(self::$cacheBaseUrl . $urlRelativeToBase, $fileSHA1);
		}
		if ($fileTimestamp) {
			$field = Q_Config::get(Q::app(), 'response', 'cacheBustField', 'Q.cacheBust');
			Q::parse_str($tail, $fields);
			$fields[$field] = $fileTimestamp;
			$qs = http_build_query($fields);
			return array(Q_Uri::fixUrl("$head?$qs"), $fileSHA1);
		}
		return array($url, $fileSHA1);
	}
	
	/**
	 * @method fromArray
	 * @static
	 * @protected
	 * @param {array} $source
	 * @return {Q_Uri}
	 */
	protected static function fromArray(
	 $source)
	{
		$u = new Q_Uri();
		if (isset($source['?'])) {
			$u->querystring = $source['?'];
			unset($source['?']);
		}
		if (isset($source['#'])) {
			$u->anchorstring = $source['#'];
			unset($source['#']);
		}
		$u->fields = $source;
		return $u;
	}
	
	/**
	 * @method fromString
	 * @static
	 * @protected
	 * @param {string} $source
	 * @return {Q_Uri}
	 * @throws {Q_Exception_WrongType}
	 */
	protected static function fromString(
	 $source)
	{		
		if (!is_string($source)) {
			// Better to throw an exception that return a non-object,
			// which may cause a fatal error
			throw new Q_Exception_WrongType(array('field' => 'source', 'type' => 'string'));
		}
		$uri = new Q_Uri();
		$source_parts = explode(' ', $source, 2);
		$parts = explode('#', $source_parts[0], 2);
		if (count($parts) > 1) {
			$uri->anchorstring = $parts[1];
		}
		$parts = explode('?', $parts[0], 2);
		if (count($parts) > 1){
			$uri->querystring = $parts[1];
		}
		$parts2 = explode('/', $parts[0], 2);
		if (count($parts2) < 2) {
			throw new Q_Exception('"' . $parts[0] . '" is not of the form $module/$action');
		}
		$uri->fields['module'] = $parts2[0];
		$uri->fields['action'] = $parts2[1];
		if (count($source_parts) > 1) {
			$more_fields = self::decode($source_parts[1]);
			foreach ($more_fields as $name => $value) {
				$uri->fields[$name] = $value;
			}
		}
		return $uri;
	}
	
	/**
	 * @method encode
	 * @static
	 * @protected
	 * @param {array} $fields An array of fields
	 * @return {string} A representation like a=b c=d where a, b, c, d are urlencoded
	 */
	protected static function encode(
	 $fields)
	{
		$clauses = array();
		ksort($fields);
		foreach ($fields as $k => $v) {
			if (is_array($v)) {
				$v_parts = array();
				foreach ($v as $v2) {
					$v_parts[] = urlencode($v2);
				}
				$clauses[] = urlencode($k).'='.implode('/', $v_parts);
			} else {
				$clauses[] = urlencode($k).'='.urlencode($v);
			}
		}
		return implode(' ', $clauses);
	}
	
	/**
	 * @method decode
	 * @static
	 * @protected
	 * @param {string} $tail This can either be JSON, or something that looks like a=b c=d where a, b, c, d are urlencoded
	 * @return {array}
	 */
	protected static function decode(
	 $tail)
	{
		if ($tail[0] === '{' and $result = Q::json_decode($tail, true)) {
			return $result;
		}
		$clauses = explode(' ', $tail);
		$result = array();
		foreach ($clauses as $clause) {
			list($left, $right) = explode('=', $clause);
			$right_parts = explode('/', $right);
			if (count($right_parts) === 1) {
				$result[urldecode($left)] = urldecode($right);
			} else {
				$left_parts = array();
				foreach ($right_parts as $rp) {
					$left_parts[] = urldecode($rp);
				}
				$result[urldecode($left)] = $left_parts;
			}
		}
		return $result;
	}
	
	/**
	 * @property $fields
	 * @protected
	 * @type array
	 */
	protected $fields = array();
	/**
	 * @property $route
	 * @protected
	 * @type string
	 */
	protected $route = null;
	/**
	 * @property $querystring
	 * @protected
	 * @type string
	 */
	protected $querystring = null;
	/**
	 * @property $anchorstring
	 * @protected
	 * @type string
	 */
	protected $anchorstring = null;
	/**
	 * @property $suffix
	 * @protected
	 * @type array
	 */
	protected static $suffix = array();
	/**
	 * @property $variablePrefixes
	 * @public
	 * @type array
	 */
	public static $variablePrefixes = array('$', ':');
	/**
	 * @property $variablePrefixes
	 * @public
	 * @type array
	 */
	public static $escapedVariablePrefixes = array('\$', '\:');
	/**
	 * @property $cacheBaseUrl
	 * @public
	 * @type string
	 */
	protected static $cacheBaseUrl = null;
	/**
	 * Information on modification times and hashes of web resources
	 * @property $urls
	 * @public
	 * @type string
	 */
	static $urls = array();
	/**
	 * Information on what resources to tell the client to preload
	 * @property $preload
	 * @public
	 * @type string
	 */
	static $preload = array();
	/**
	 * @property $url
	 * @public
	 * @type array
	 */
	protected $Q_url = null;
}

// trying to get caching $urls
if (empty(Q_Uri::$urls)) {
	$urlsFile = implode(DS, array(APP_CONFIG_DIR, "Q", "urls.php"));
	is_file($urlsFile) && require_once($urlsFile);
}