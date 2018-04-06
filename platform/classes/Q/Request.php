<?php

/**
 * @module Q
 */
/**
 * Functions for dealing with a web server request
 * @class Q_Request
 */
class Q_Request
{	
	/**
	 * Get the base URL, possibly with a controller script
	 * @method baseUrl
	 * @static
	 * @param {boolean} [$withPossibleController=false]
	 *  If this is true, and if the URL contains 
	 *  the controller script, then the controller script is included 
	 *  in the return value. You can also pass a string here, which
	 *  will then be simply appended as the controller.
	 * @param {boolean} [$canonical=false]
	 *  Pass true here to just use the canonical info specified in the "Q"/"web" config.
	 */
	static function baseUrl(
	 $withPossibleController = false,
	 $canonical = false)
	{
		if ($canonical) {
			$ar = Q_Config::get('Q', 'web', 'appRootUrl', false);
			if (!$ar) {
				throw new Q_Exception_MissingConfig(array(
					'fieldpath' => 'Q/web/appRootUrl'
				));
			}
			$cs = Q_Config::get('Q', 'web', 'controllerSuffix', '');
			if (!$withPossibleController) {
				return $ar;
			}
			if (is_string($withPossibleController)) {
				return $ar . "/" . $withPossibleController;
			}
			return $ar . (!$cs || substr($cs, 0, 1) === '/' ? $cs : "/$cs");
		}
		
		if (isset(self::$base_url)) {
			if (is_string($withPossibleController)) {
				if (empty($withPossibleController)) {
					return self::$app_root_url;
				}
				return self::$app_root_url . "/" . $withPossibleController;
			}
			if ($withPossibleController) {
				return self::$base_url;
			}
			return self::$app_root_url;
		}
		
		if (isset($_SERVER['SERVER_NAME'])) {
			// This is a web request, so we can automatically determine
			// the app root URL. If you want the canonical one which the developer
			// may have specified in the config field "Q"/"web"/"appRootUrl"
			// then just query it via Q_Config::get().
			
			// Infer things
			self::$controller_url = self::inferControllerUrl($script_name);

			// Get the app root URL
			self::$app_root_url = self::getAppRootUrl();

			// Automatically figure out whether to omit 
			// the controller name from the url
			self::$controller_present = (0 == strncmp(
				$_SERVER['REQUEST_URI'], 
				$_SERVER['SCRIPT_NAME'], 
				strlen($_SERVER['SCRIPT_NAME']) 
			));
			
			// Special case for action.php controller
			// in case a misconfigured web server executes index.php even though
			// a url of the form $base_url/action.php/... was requested,
			// we will try to detect action.php anyway, and set it accordingly
			$slashpos = strrpos($script_name, '/');
			$action_script_name = ($slashpos ? substr($script_name, 0, $slashpos) : '')
				. '/action.php';
			if (0 == strncmp(
				$_SERVER['REQUEST_URI'], 
				$action_script_name, 
				strlen($action_script_name) 
			)) {
				self::$controller_url = 
					substr(self::$controller_url, 0, strrpos(self::$controller_url, '/'))
					. '/action.php';
				self::$controller_present = true;
				Q::$controller = 'Q_ActionController';
			}

			// Set the base url
			self::$base_url = (self::$controller_present)
				? self::$controller_url
				: self::$app_root_url;
		} else {
			// This is not a web request, and we absolutely need
			// the canonical app root URL to have been specified.
			$ar = Q_Config::get('Q', 'web', 'appRootUrl', false);
			if (!$ar) {
				throw new Q_Exception_MissingConfig(array(
					'fieldpath' => 'Q/web/appRootUrl'
				));
			}
			$cs = Q_Config::get('Q', 'web', 'controllerSuffix', '');
			$tail = (!$cs || substr($cs, 0, 1) === '/' ? $cs : "/$cs");
			self::$app_root_url = $ar;
			self::$controller_url = $ar . $tail;
			self::$controller_present = false;
			self::$base_url = self::$controller_url;
		}
		
		if (is_string($withPossibleController)) {
			return self::$app_root_url . "/" . $withPossibleController;
		}
		if ($withPossibleController) {
			return self::$base_url;
		}
		return self::$app_root_url;
	}
	
	/**
	 * Returns the base URL, run through a proxy
	 * @method proxyBaseUrl
	 * @static
	 * @param {boolean} [$withPossibleController=false] If this is true, and if the URL contains 
	 *  the controller script, then the controller script is included 
	 *  in the base url. You can also pass a string here, which
	 *  will then be simply appended as the controller.
	 */
	static function proxyBaseUrl(
		$withPossibleController = false)
	{
		return Q_Uri::proxySource(self::baseUrl($withPossibleController));
	}
	
	/**
	 * Get the URL that was requested, possibly with a querystring
	 * @method url
	 * @static
	 * @param {mixed} [$queryFields=array()] If true, includes the entire querystring as requested.
	 *  If a string, appends the querystring correctly to the current URL.
	 *  If an associative array, adds these fields, with their values
	 *  to the existing querystring, while subtracting the fields corresponding
	 *  to null values in $query.
	 *  (For null values, the key is used as a regular expression
	 *  that matches all the fields to subtract.)
	 *  Then generates a querystring and includes it with the URL.
	 * @return {string} Returns the URL that was requested, possibly with a querystring.
	 */
	static function url(
	 $queryFields = array())
	{
		if (!isset($_SERVER['REQUEST_URI'])) {
			// this was not requested from the web
			return null;
		}
		$request_uri = $_SERVER['REQUEST_URI'];
		
		// Deal with the querystring
		$r_parts = explode('?', $request_uri);
		$request_uri = $r_parts[0];
		$request_querystring = isset($r_parts[1]) ? $r_parts[1] : '';
		
		// Extract the URL
		if (!isset(self::$url)) {
			$server_name = $_SERVER['SERVER_NAME'];
			if ($server_name[0] === '*') {
				$server_name = $_SERVER['HTTP_HOST'];
			}
			self::$url = sprintf('http%s://%s%s%s%s%s%s', 
				empty($_SERVER['HTTPS']) ? '' : 's', 
				isset($_SERVER['PHP_AUTH_USER']) ? $_SERVER['PHP_AUTH_USER'] : '',
				isset($_SERVER['PHP_AUTH_PW']) ? ':'.$_SERVER['PHP_AUTH_PW'] : '',
				isset($_SERVER['PHP_AUTH_USER']) ? '@' : '',
				$server_name, 
				$_SERVER['SERVER_PORT'] != (!empty($_SERVER['HTTPS']) ? 443 : 80) 
					? ':'.$_SERVER['SERVER_PORT'] : '',
				$request_uri);
		}
				
		if (!$queryFields) {
			return self::$url;
		}
		
		$query = array();
		if ($request_querystring) {
			Q::parse_str($request_querystring, $query);
		}
		if (is_string($queryFields)) {
			Q::parse_str($queryFields, $qf_array);
			$query = array_merge($query, $qf_array);
		} else if (is_array($queryFields)) {
			foreach ($queryFields as $key => $value) {
				if (isset($value)) {
					$query[$key] = $value;
				} else {
					foreach (array_keys($query) as $k) {
						if (preg_match($key, $k)) {
							unset($query[$k]);
						}
					}
				}
			}
		}
		if (!empty($query)) {
			return self::$url.'?'.http_build_query($query, null, '&');
		}
		return self::$url;
	}
	/**
	 * Get combination of module/action from URL
	 * @method uri
	 * @static
	 * @return {Q_Uri}
	 */
	static function uri()
	{
		if (!isset(self::$uri)) {
			self::$uri = Q_Uri::from(self::url());
		}
		return self::$uri;
	}
	/**
	 * Get just action name (without module name) from URL
	 * @method tail
	 * @static
	 * @param {string} [$url=null]
	 * @return {string}
	 */
	static function tail(
	 $url = null)
	{
		if (!isset($url)) {
			$url = self::url();
		}
		$base_url = self::baseUrl(true); // first, try with the controller URL
		$base_url_len = strlen($base_url);
		if (substr($url, 0, $base_url_len) != $base_url) {
			$base_url = self::$app_root_url; // okay, try with the app root
			$base_url_len = strlen($base_url);
			if (substr($url, 0, $base_url_len) != $base_url) {
				return null;
			}
		}
		$result = substr($url, $base_url_len + 1);
		return $result ? $result : '';
	}
	
	/**
	 * @method filename
	 * @beta
	 * @static
	 * @return {string}
	 */
	static function filename()
	{
		$url = Q_Request::url();
		$ret = Q::event("Q/request/filename", compact('url'), 'before');
		if (isset($ret)) {
			return $ret;
		}
		$parts = explode('.', $url);
		$ext = end($parts);
		if (strpos($ext, '/') !== false) {
			$ext = '';
		}
		$extensions = Q_Config::expect("Q", "filename", "extensions");
		$filename = Q_PLUGIN_WEB_DIR.DS.'img'.DS.'404'.DS."404.$ext";
		return in_array($ext, $extensions) ? $filename : null;
	}
	
	/**
	 * The names of slots that were requested, if any
	 * @method slotNames
	 * @static
	 * @param {boolean} [$returnDefaults=false] If set to true, returns the array of slot names set in config field 
	 *  named Q/response/$app/slotNames
	 *  in the event that slotNames was not specified at all in the request.
	 * @return {array}
	 */
	static function slotNames($returnDefaults = false)
	{
		if (isset(self::$slotNames_override)) {
			return self::$slotNames_override;
		}
		if (null === Q_Request::special('slotNames', null)) {
			if ($returnDefaults !== true) {
				return null;
			}
			$slotNames = Q_Config::get(
				'Q', 'response', 'slotNames',
				array('content', 'dashboard', 'title', 'notices') // notices should be last
			);
			if (Q_Request::isMobile()) {
				$mobile_slotNames = Q_Config::get(
					'Q', 'response', 'mobileSlotNames',
					false
				);
				if ($mobile_slotNames) {
					$slotNames = $mobile_slotNames;
				}
			}
			return $slotNames;
		}
		$slotNames = Q_Request::special('slotNames', null);
		if (empty($slotNames)) {
			return array();
		}
		if (is_string($slotNames)) {
			$arr = array();
			foreach (explode(',', $slotNames) as $sn) {
				$arr[] = $sn;
			}
			$slotNames = $arr;
		}
		return $slotNames;
	}
	
	/**
	 * Returns whether a given slot name was requested.
	 * @method slotNames
	 * @static
	 * @param {string} $slotName The name of the slot
	 * @return {boolean}
	 */
	static function slotName($slotName)
	{
		return in_array($slotName, Q_Request::slotNames(true));
	}
	
	/**
	 * The name of the callback that was specified, if any
	 * @method callback
	 * @static
	 * @return {string}
	 */
	static function callback()
	{
		return Q_Request::special('callback', null);
	}
	
	/**
	 * @method contentToEcho
	 * @static
	 * @return {array}
	 */
	static function contentToEcho()
	{
		return Q_Request::special('echo', null);
	}
	
	/**
	 * Use this to determine whether or not it the request is an "AJAX"
	 * request, and is not expecting a full document layout.
	 * @method isAjax
	 * @static
	 * @return {string} The contents of `Q.ajax` if it is present.
	 */
	static function isAjax()
	{
		static $result;
		if (isset($result)) {
			return $result;
		}
		/**
		 * @event Q/request/isAjax {before}
		 * @return {string}
		 */
		$result = Q::event('Q/request/isAjax', array(), 'before');
		if (isset($result)) {
			return $result;
		}
		$result = Q_Request::special('ajax', false);
		return $result;
	}
	
	/**
	 * Use this to determine whether or not it the request is an "loadExtras"
	 * request, and is expecting responseExtras.
	 * @method isLoadExtras
	 * @static
	 * @return {string} The contents of `Q.loadExtras` if it is present.
	 */
	static function isLoadExtras()
	{
		static $result;
		if (isset($result)) {
			return $result;
		}
		/**
		 * @event Q/request/isLoadExtras {before}
		 * @return {string}
		 */
		$result = Q::event('Q/request/isLoadExtras', array(), 'before');
		if (isset($result)) {
			return $result;
		}
		$result = (Q_Request::special('ajax', false) === 'loadExtras');
		return $result;
	}
	
	/**
	 * Detects whether the request is coming from a mobile browser
	 * @method isMobile
	 * @static
	 * @return {boolean}
	 */
	static function isMobile()
	{
		static $result;
		if (isset($result)) {
			return $result;
		}
		/**
		 * @event Q/request/isMobile {before}
		 * @return {boolean}
		 */
		$result = Q::event('Q/request/isMobile', array(), 'before');
		if (isset($result)) {
			return $result;
		}
		return (Q_Request::isTouchscreen() and !Q_Request::isTablet());
	}
	
	/**
	 * Detects whether the request is coming from a tablet browser
	 * @method isTablet
	 * @static
	 * @return {boolean}
	 */
	static function isTablet()
	{
		static $result;
		if (isset($result)) {
			return $result;
		}
		/**
		 * @event Q/request/isTablet {before}
		 * @return {boolean}
		 */
		$result = Q::event('Q/request/isTablet', array(), 'before');
		if (isset($result)) {
			return $result;
		}
		if (!isset($_SERVER['HTTP_USER_AGENT'])) {
			return null;
		}
		$useragent = $_SERVER['HTTP_USER_AGENT'];
		if (preg_match('/tablet|ipad/i', $useragent)) {
			return true;
		}
		if (self::isTouchscreen() and !preg_match('/mobi/i', $useragent)) {
			return true;
		}
		return false;
	}
	
	/**
	 * Detects whether the request is coming from a browser which supports touch events
	 * @method isTouchscreen
	 * @static
	 * @return {boolean}
	 */
	static function isTouchscreen()
	{
		if (!isset($_SERVER['HTTP_USER_AGENT'])) {
			return null;
		}
		$useragent = $_SERVER['HTTP_USER_AGENT'];
		return preg_match('/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i',$useragent)||preg_match('/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i',substr($useragent,0,4))
			? true: false;
	}

	/**
	 * Detects whether the request is coming from an Internet Explorer browser
	 * @method isIE
	 * @static
	 * @param {number} [$min_version=0] optional minimum version of IE to check (major number like 7, 8, 9 etc).
	 * If provided, the method will return true only if the browser is IE and the major version is greater or equal than $min_version.
	 * @param {number} [$max_version=0] optional maximum version of IE to check (major number like 7, 8, 9 etc).
	 * If provided, the method will return true only if the browser is IE and the major version is less or equal than $max_version.
	 * @return {boolean}
	 */
	static function isIE($min_version = 0, $max_version = 100)
	{
		static $result;
		if (isset($result)) {
			return $result;
		}
		if (!isset($_SERVER['HTTP_USER_AGENT'])) {
			return null;
		}
		$useragent = $_SERVER['HTTP_USER_AGENT'];
		preg_match('/(MSIE) (\d)/i', $useragent, $matches);
		$version = false;
		if (count($matches) == 3) {
			$version = intval($matches[2]);
		} else {
			preg_match('/Trident.*rv:(\d+)/', $useragent, $matches);
			if (count($matches) == 2) {
				$version = intval($matches[1]);
			}
		}
		if ($version) {
			$result = ($version >= $min_version && $version <= $max_version);
		}
		return $result;
	}
	
	/**
	 * Detects whether the request is coming from an Internet Explorer browser
	 * @method isAndroidStock
	 * @static
	 * If provided, the method will return true only if the platform is Android and the major version is less or equal than $max_version.
	 * @return {boolean}
	 */
	static function isAndroidStock()
	{
		if (!isset($_SERVER['HTTP_USER_AGENT'])) {
			return null;
		}
		if (self::platform() !== 'android') {
			return false;
		}
		$useragent = $_SERVER['HTTP_USER_AGENT'];
		return !!preg_match('/Android .*Version\/[\d]+\.[\d]+/i', $useragent);
	}
	
	/**
	 * Detects whether the request is coming from a WebView on a mobile browser
	 * @method isWebView
	 * @static
	 * @return {boolean}
	 */
	static function isWebView()
	{
		static $result;
		if (isset($result)) {
			return $result;
		}
		/**
		 * @event Q/request/isWebView {before}
		 * @return {boolean}
		 */
		$result = Q::event('Q/request/isWebView', array(), 'before');
		if (isset($result)) {
			return $result;
		}
		if (!isset($_SERVER['HTTP_USER_AGENT'])) {
			return null;
		}
		$useragent = $_SERVER['HTTP_USER_AGENT'];
		if (preg_match('/(.*)QWebView(.*)/', $useragent)
		or preg_match('/(.*)QCordova(.*)/', $useragent)
		or preg_match('/(iPhone|iPod|iPad).*AppleWebKit(?!.*Version)/i', $useragent)) {
			return true;
		}
		return false;
	}
	
	/**
	 * Detects whether the request is coming from a WebView enabled with Cordova
	 * @method isCordova
	 * @static
	 * @return {string|boolean} The version of the cordova, or false if not cordova.
	 */
	static function isCordova()
	{
		static $result;
		if (isset($result)) {
			return $result;
		}
		if (!isset($_SERVER['HTTP_USER_AGENT'])) {
			return null;
		}
		$useragent = $_SERVER['HTTP_USER_AGENT'];
		$version = Q_Request::special('cordova', null);
		if ($version or preg_match('/(.*)QCordova(.*)/', $useragent)) {
			return $version ? $version : "?";
		}
		return false;
	}
	
	/**
	 * Returns the form factor based on the user agent
	 * @method formFactor
	 * @static
	 * @return {string} can be either 'mobile', 'tablet', or 'desktop'
	 */
	static function formFactor()
	{
		return self::isMobile() ? 'mobile' : (self::isTablet() ? 'tablet' : 'desktop');
	}
	
	/**
	 * Gets all the names of the fields with no value or equal
	 * @method special
	 * @param {String|Array|Object} name The name of the field. If it's an array, returns an object of {name: value} pairs. If it's an object, then they are added onto the querystring and the result is returned. If it's a string, it's the name of the field to get. And if it's an empty string, then we get the array of field names with no value, e.g. ?123&456&a=b returns array(123,456)
	 * @param {mixed} $default what to return if field is missing
	 * @param {string} [$source=null] optionally provide an array to use instead of $_REQUEST
	 * @static
	 * @return {mixed|null}
	 */
	static function queryField($name)
	{
		if ($name) {
			$name = str_replace('.', '_', $name);
			return isset($_REQUEST[$name]) ? $_REQUEST[$name] : null;
		}
		$result = array();
		foreach ($_REQUEST as $k => $v) {
			if (empty($v)) {
				$result[] = $k;
			}
		}
		return $result;
	}
	
	/**
	 * Gets a field passed in special a part of the request
	 * @method special
	 * @param {string} $fieldname the name of the field, which can be namespaced as "Module.fieldname"
	 * @param {mixed} $default optionally what to return if field is missing
	 * @param {string} [$source=null] optionally provide an array to use instead of $_REQUEST
	 * @static
	 * @return {mixed|null}
	 */
	static function special($fieldname, $default = null, $source = null)
	{
		if (!$source) {
			$source = array_merge($_GET, $_POST, $_COOKIE);
		}
		// PHP replaces dots with underscores
		if (isset($source["Q_$fieldname"])) {
			return $source["Q_$fieldname"];
		}
		$fieldname = str_replace(array('/', '.'), '_', $fieldname);
		if (isset($source["Q_$fieldname"])) {
			return $source["Q_$fieldname"];
		}
		
		return $default;
	}
	
	/**
	 * Returns a string identifying user browser's platform.
	 * @method platform
	 * @static
	 * @return {string}
	 */
	static function platform()
	{
		if (!isset($_SERVER['HTTP_USER_AGENT'])) {
			return null;
		}
		$useragent = $_SERVER['HTTP_USER_AGENT'];
		if (preg_match('/ip(hone|od|ad)/i', $useragent))
			return 'ios';
		else if (preg_match('/android/i', $useragent))
			return 'android';
		else if (preg_match('/mac/i', $useragent))
			return 'mac';
		else if (preg_match('/linux/i', $useragent))
			return 'linux';
		else if (preg_match('/windows/i', $useragent))
			return 'windows';
	}

	/**
	 * Returns a string identifying user platform version.
	 * @method version
	 * @static
	 * @return {string}
	 */
	static function OSVersion() {
		if (!isset($_SERVER['HTTP_USER_AGENT'])) {
			return null;
		}
		$platform = self::platform();
		$useragent = $_SERVER['HTTP_USER_AGENT'];
		$len = strlen($useragent);
		switch ($platform) {
			case 'ios':
				$index = strpos($useragent, 'OS ');
				if ($index === false) return null;
				$ver = substr($useragent, $index + 3, 3);
				return implode('.', explode('_', $ver));
				break;
			case 'android':
				$index = strpos($useragent, 'Android ');
				if ($index === false) return null;
				return substr($useragent, $index + 8, 3);
				break;
			case 'mac':
			case 'windows':
			case 'linux':
				$find = array(
					'mac' => 'Macintosh',
					'windows' => 'Windows',
					'linux' => 'Linux'
				);
				$index = strpos($useragent, $find[$platform]);
				if ($index === false) return null;
				$paren = strpos($useragent, ')', $index + 1);
				$ur = strrev($useragent);
				$pos = strpos($ur, ' ', $len - $paren);
				$space = ($pos === false) ? false : $len - $pos;
				$pos = strpos($ur, ':', $len - $paren);
				$colon = ($pos === false) ? false : $len - $pos;
				$max = ($space !== false and $space > $colon) ? $space : $colon;
				if ($max === false) return null;
				$ver = substr($useragent, $max, $paren - $max);
				return str_replace('_', '.', $ver);
			default:
				return null;
				break;
		}
	}
	
	/**
	 * Returns the name of the browser that made the request
	 * @return {string} can be "ie", "firefox", "chrome", "safari", "opera", otherwise null
	 */
	static function browser()
	{
		$userAgent = strtolower($_SERVER['HTTP_USER_AGENT']);
		$detect = array(
			'msie' => 'ie',
			'firefox' => 'firefox',
			'chrome' => 'chrome',
			'safari' => 'safari',
			'opera' => 'opera'
		);
		foreach ($detect as $k => $v) {
			if (strpos($userAgent, $k) !== false) {
				return $v;
			}
		}
		return null;
	}
	
	/**
	 * Returns the app's id on the platform
	 * @return {string}
	 */
	static function appId()
	{
		return self::special('appId');
	}
	
	/**
	 * Returns the device udid generated by a tool like Cordova or Electron
	 * @return {string}
	 */
	static function udid()
	{
		return self::special('udid');
	}
	
	/**
	 * Use this to determine what method to treat the request as.
	 * @method method
	 * @static
	 * @return {string} Returns an uppercase string such as "GET", "POST", "PUT", "DELETE"
	 * 
	 * See [Request methods](http://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol#Request_methods)
	 */
	static function method()
	{
		if (isset(self::$method_override)) {
			return self::$method_override;
		}
		static $result;
		if (!isset($result)) {
			/**
			 * @event Q/request/method {before}
			 * @return {string}
			 */
			$result = Q::event('Q/request/method', array(), 'before');
			if ($result) {
				return $result;
			}
		}
		if (null !== Q_Request::special('method', null)) {
			return strtoupper(Q_Request::special('method', null));
		}
		if (!isset($_SERVER['REQUEST_METHOD'])) {
			return 'GET';
		}
		return strtoupper($_SERVER['REQUEST_METHOD']);
	}
	
	/**
	 * Used to find out whether a given mime type is accepted by the client
	 * @method accepts
	 * @static
	 * @return {boolean}
	 */
	static function accepts($mimeType)
	{
		/**
		 * @event Q/request/accepts {before}
		 * @param {string} mimeType
		 * @return {boolean}
		 */
		$ret = Q::event('Q/request/accepts', compact('mimeType'), 'before');
		if (isset($ret)) {
			return $ret;
		}
		$mt_parts = explode('/', $mimeType);
		
		$accept = array();
		if (!isset($_SERVER['HTTP_ACCEPT'])) {
			$accept = array();
		} else {
			foreach (explode(',', $_SERVER['HTTP_ACCEPT']) as $header){
				$parts = explode(';', $header);
				if (count($parts) === 1) { $parts[1] = true; }
				$accept[$parts[0]] = $parts[1];
			}
		}
		foreach ($accept as $a => $q) {
			$a_parts = explode('/', $a);
			if ($a_parts[0] == $mt_parts[0] or $mt_parts[0] == '*') {
				if (!isset($a_parts[1]) or $a_parts[1] == $mt_parts[1]) {
					return $q;
				}
			}
		}
		return false;
	}
	
	/**
	 * Used to find out what languages are accepted by the user agent,
	 * by analyzing the Accepts-Language header. May also get locale information.
	 * @method accepts
	 * @static
	 * @return {array} returns array of array("en", "US", 0.8) entries
	 */
	static function languages()
	{
		/**
		 * @event Q/request/languages {before}
		 * @return {boolean}
		 */
		$ret = Q::event('Q/request/languages', array(), 'before');
		if (isset($ret)) {
			return $ret;
		}
		$available = Q_Config::get('Q', 'web', 'languages', array('en' => 1));
		$header = Q::ifset($_SERVER, 'HTTP_ACCEPT_LANGUAGE', 'en');
		$parts = explode(',', $header);
		$result = array();
		foreach ($parts as $p) {
			$parts2 = explode(';', $p);
			if (!$parts2) {
				continue;
			}
			$parts3 = explode('-', $parts2[0]);
			$language = strtolower($parts3[0]);
			$country = !empty($parts3[1]) ? strtoupper($parts3[1]) : null;
			if (empty($available[$language])) {
				continue;
			}
			$quality = !empty($parts2[1]) ? substr($parts2[1], 2) : 1;
			$result[] = array($language, $country, $quality);
		}
		if (empty($result)) {
			return array(array("en", "US", 1));
		}
		return $result;
	}
	
	/**
	 * Gets the locale of the user agent in the form "en_GB" etc.
	 * @method locale
	 * @static
	 * @param {string} [$separator='_'] The separator to use
	 * @return {string} The locale
	 */
	static function locale($separator = '_')
	{
		$languages = self::languages();
		list($lang, $country, $preference) = reset($languages);
		return "$lang$separator$country";
	}
	
	/**
	 * Used by the system to find out the last timestamp a cache was generated,
	 * so it can be used instead of the actual files.
	 * @method cacheTimestamp
	 * @static
	 * @return {boolean}
	 */
	static function cacheTimestamp()
	{
		return self::special('ct', null);
	}
	
	/**
	 * Convenience method to apply certain criteria to an array.
	 * and call Q_Response::addError for each one.
	 * @see Q_Valid::requireFields
	 * @method requireFields
	 * @static
	 * @param {array} $fields Array of strings or arrays naming fields that are required
	 * @param {boolean} [$throwIfMissing=false] Whether to throw an exception if the field is missing
	 * @return {array} The resulting list of exceptions
	 */
	static function requireFields($fields, $throwIfMissing = false)
	{
		$args = func_get_args();
		array_splice($args, 1, 0, array(null));
		$exceptions = call_user_func_array(array('Q_Valid', 'requireFields'), $args);
		Q_Response::addError($exceptions);
	}
	
	/**
	 * Used called internally, by event handlers to see if the requested
	 * URI requires a valid nonce to be submitted, to prevent CSRF attacks.
	 * @see Q_Valid::requireValidNonce
	 * @method requireValidNonce
	 * @static
	 * @throws {Q_Exception_FailedValidation}
	 */
	static function requireValidNonce()
	{
		$list = Q_Config::get('Q', 'web', 'requireValidNonce', array());
		$uri = Q_Dispatcher::uri();
		foreach ($list as $l) {
			$parts = explode('/', $l);
			if ($uri->module !== $parts[0]) {
				continue;
			}
			if (isset($parts[1]) and $uri->action !== $parts[1]) {
				continue;
			}
			return Q_Valid::nonce(true);
		}
	}
	
	/**
	 * Some standard info to be stored in sessions, devices, etc.
	 * @return {array}
	 */
	static function userAgentInfo()
	{
		$info = array(
			'formFactor' => Q_Request::formFactor(),
			'platform' => Q_Request::platform(),
			'version' => Q_Request::OSVersion()
		);
		$fields = Q_Config::get('Q', 'session', 'userAgentInfo', array());
		return Q::take($info, $fields);
	}
	
	/**
	 * Get access to more browser capabilities
	 * @return {Q_Browscap}
	 */
	static function browscap()
	{
		static $result = null;
		if (!isset($result)) {
			$result = new Q_Browscap(Q_FILES_DIR.DS.'Q'.DS.'Browscap'.DS.'cache');
		}
		return $result;
	}
	
	/**
	 * Infers the base URL, with possible controller
	 * @method inferControllerUrl
	 * @static
	 * @protected
	 * @param {&string} $script_name
	 * @return {string}
	 */
	protected static function inferControllerUrl(&$script_name)
	{
		// Must be called from the web
		if (!isset(self::$url) and !isset($_SERVER['SCRIPT_NAME'])) {
			throw new Exception('$_SERVER["SCRIPT_NAME"] is missing');
		}

		// Try to infer the web url as follows:
		$script_name = str_replace('batch.php', 'action.php', $_SERVER['SCRIPT_NAME']);
		if ($script_name == '' or $script_name == '/')
			$script_name = '/index.php';
		$extpos = strrpos($script_name, '.php');
		if ($extpos === false) {
			// Rewrite rules were used, at the local URL root
			$script_name = '/index.php' . $script_name;
		}
		$server_name = $_SERVER['SERVER_NAME'];
		if ($server_name[0] === '*') {
			$server_name = $_SERVER['HTTP_HOST'];
		}

		return sprintf('http%s://%s%s%s%s%s%s', 
			empty($_SERVER['HTTPS']) ? '' : 's',
			isset($_SERVER['PHP_AUTH_USER']) ? $_SERVER['PHP_AUTH_USER'] : '',
			isset($_SERVER['PHP_AUTH_PW']) ? ':'.$_SERVER['PHP_AUTH_PW'] : '',
			isset($_SERVER['PHP_AUTH_USER']) ? '@' : '', 
			$server_name,
			$_SERVER['SERVER_PORT'] != (!empty($_SERVER['HTTPS']) ? 443 : 80) 
				? ':'.$_SERVER['SERVER_PORT'] : '',
			$script_name);
	}
	
	/**
	 * Gets the app root url
	 * @method getAppRootUrl
	 * @static
	 * @protected
	 * @return {string}
	 */
	protected static function getAppRootUrl()
	{
		if (isset(self::$app_root_url)) {
			return self::$app_root_url;
		}
		$app_root = substr($_SERVER['SCRIPT_NAME'], 
		 0, strrpos($_SERVER['SCRIPT_NAME'], '/'));
		$server_name = $_SERVER['SERVER_NAME'];
		if ($server_name[0] === '*') {
			$server_name = $_SERVER['HTTP_HOST'];
		}
		return sprintf('http%s://%s%s%s%s%s%s', 
			empty($_SERVER['HTTPS']) ? '' : 's',
			isset($_SERVER['PHP_AUTH_USER']) ? $_SERVER['PHP_AUTH_USER'] : '',
			isset($_SERVER['PHP_AUTH_PW']) ? ':'.$_SERVER['PHP_AUTH_PW'] : '',
			isset($_SERVER['PHP_AUTH_USER']) ? '@' : '',
			$server_name,
			$_SERVER['SERVER_PORT'] != (!empty($_SERVER['HTTPS']) ? 443 : 80) 
				? ':'.$_SERVER['SERVER_PORT'] : '',
			$app_root);
	}
	
	/**
	 * @property $url
	 * @static
	 * @type string
	 */
	static protected $url = null;
	/**
	 * @property $uri
	 * @static
	 * @type string
	 */
	static protected $uri = null;
	/**
	 * @property $controller_url
	 * @static
	 * @type string
	 */
	static protected $controller_url = null;
	/**
	 * @property $base_url
	 * @static
	 * @type string
	 */
	static protected $base_url = null;
	/**
	 * @property $app_root_url
	 * @static
	 * @type string
	 */
	static protected $app_root_url = null;
	/**
	 * @property $controller_present
	 * @static
	 * @type string
	 */
	static protected $controller_present = null;
	/**
	 * @property $slotNames_override
	 * @static
	 * @type string
	 */
	static $slotNames_override = null;
	/**
	 * @property $method_override
	 * @static
	 * @type string
	 */
	static $method_override = null;
}
