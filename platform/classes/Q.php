<?php

/**
 * Contains core Qbix functionality.
 * @module Q
 * @main Q
 */
/**
 * Core Qbix platform functionality
 * @class Q
 * @static
 */

class Q
{
	/**
	 * Returns the id of the currently loaded app, found in the config under "Q"/"app"
	 * @return {string}
	 */
	static function app()
	{
		return Q_Config::expect('Q', 'app');
	}
	
	/**
	 * Used for shorthand for avoiding when you don't want to write
	 * (isset($some_long_expression) ? $some_long_expression: null)
	 * when you want to avoid possible "undefined variable" errors.
	 * @method ifset
	 * @param {&mixed} $ref
	 *  The reference to test. Only lvalues can be passed.
	 *  If $ref is an array or object, it can be followed by one or more
	 *  strings or numbers, which will be used to index deeper into
	 *  the contained arrays or objects.
	 *  You can also pass arrays instead of the strings and numbers,
	 *  which will then widen the search to try all combinations
	 *  of the strings and numbers in all the arrays, before returning
	 *  the default.
	 * @param {mixed} $def=null
	 *  The default, if the reference isn't set
	 * @return {mixed}
	 */
	static function ifset(& $ref, $def = null)
	{
		$count = func_num_args();
		if ($count <= 2) {
			return isset($ref) ? $ref : $def;
		}
		$args = func_get_args();
		$ref2 = $ref;
		$def = end($args);
		for ($i=1; $i<$count-1; ++$i) {
			$key = $args[$i];
			if (!is_array($key)) {
				$key = array($key);
			}
			if (is_array($ref2)) {
				foreach ($key as $k) {
					if (array_key_exists($k, $ref2)) {
						$ref2 = $ref2[$k];
						continue 2;
					}
				}
				return $def;
			} else if (is_object($ref2)) {
				foreach ($key as $k) {
					if (isset($ref2->$k)) {
						$ref2 = $ref2->$k;
						continue 2;
					}
				}
				return $def;
			} else {
				return $def;
			}
		}
		return $ref2;
	}


	/**
	 * Returns the number of milliseconds since the
	 * first call to this function (i.e. since script started).
	 * @method milliseconds
	 * @param {Boolean} $sinceEpoch
	 *  Defaults to false. If true, just returns the number of milliseconds in the UNIX timestamp.
	 * @return {float}
	 *  The number of milliseconds, with fractional part
	 */
	static function milliseconds ($sinceEpoch = false)
	{
		$result = microtime(true)*1000;
		if ($sinceEpoch) {
			return $result;
		}

		static $microtime_start;
		if (empty($microtime_start)) {
			$microtime_start = $result;
		}
		return $result - $microtime_start;
	}

	/**
	 * Default exception handler for Q
	 * @method exceptionHandler
	 * @param {Exception} $exception
	 */
	static function exceptionHandler (
	 $exception)
	{
		try {
			/**
			 * @event Q/exception
			 * @param {Exception} $exception
			 */
			self::event('Q/exception', compact('exception'));
		} catch (Exception $e) {
			/**
			 * @event Q/exception/native
			 * @param {Exception} $exception
			 */
			// Looks like the app's custom Q/exception handler threw
			// an exception itself. Just show Q's native exception handler.
			self::event('Q/exception/native', compact('exception'));
		}
	}

	/**
	 * Error handler
	 * @method errorHandler
	 * @param {integer} $errno
	 * @param {string} $errstr
	 * @param {string} $errfile
	 * @param {integer} $errline
	 * @param {array} $errcontext
	 */
	static function errorHandler (
		$errno,
		$errstr,
		$errfile,
		$errline,
		$errcontext)
	{
	    if (!(error_reporting()  & $errno)) {
	        // This error code is not included in error_reporting
			// just continue on with execution, if possible.
			// this situation can also happen when
			// someone has used the @ operator.
	        return;
	    }
		switch ($errno) {
			case E_WARNING:
			case E_NOTICE:
			case E_USER_WARNING:
			case E_USER_NOTICE:
				$context = Q::var_dump($errcontext, 4, '$', 'text');
				$dump = Q_Exception::coloredString(
					$errstr, $errfile, $errline, $context
				);
				Q::log("PHP Error($errno): \n\n$dump", null, null, array(
					'maxLength' => 10000
				));
				$type = 'warning';
				break;
			default:
				$type = 'error';
				break;
		}
		/**
		 * @event Q/error
		 * @param {integer} errno
		 * @param {string} errstr
		 * @param {string} errfile
		 * @param {integer} errline
		 * @param {array} errcontext
		 */
		self::event("Q/error", compact(
			'type','errno','errstr','errfile','errline','errcontext'
		));
	}

	/**
	 * Test whether $text is prefixed by $prefix
	 * @method startsWith
	 * @static
	 * @param {string|array} $text The string or array of strings to check
	 * @param {string} $prefix
	 * @return {boolean}
	 */
	static function startsWith($text, $prefix)
	{
		if (is_string($text)) {
			return substr($text, 0, strlen($prefix)) === $prefix;	
		}
		if (is_array($text)) {
			foreach ($text as $t) {
				if (!self::startsWith($t, $prefix)) {
					return false;
				}
			}
			return true;
		}
	}

	/**
	 * Goes through the params and replaces any references
	 * to their names in the string with their value.
	 * References are expected to be of the form {{varname}} or $varname.
	 * However, dollar signs prefixed with backslashes will not be replaced.
	 * @method interpolate
	 * @static
	 * @param {string} $expression
	 *  The string containing possible references to interpolate values for.
	 * @param {array|string} $params=array()
	 *  An array of parameters to the expression.
	 *  Variable names in the expression can refer to them.
	 *  You can also pass an indexed array, in which case the expression's
	 *  placeholders of the form {{0}}, {{1}}, or $0, $1 will be replaced by the
	 *  corresponding strings.
	 *  If the expression is missing {{0}} and $0, then {{1}} or $1 is replaced
	 *  by the first string, {{2}} or $2 by the second string, and so on.
	 * @return {string}
	 *  The result of the interpolation
	 */
	static function interpolate(
		$expression,
		$params = array())
	{
		$a = (
			strpos($expression, '{{0}}') === false
			and strpos($expression, '$0') === false
		) ? 1 : 0;
		$keys = array_keys($params);
		usort($keys, array(__CLASS__, 'reverseLengthCompare'));
		$expression = str_replace('\\$', '\\REAL_DOLLAR_SIGN\\', $expression);
		foreach ($keys as $key) {
			$p = (is_array($params[$key]) or is_object($params[$key]))
				? substr(Q::json_encode($params[$key]), 0, 100)
				: (string)$params[$key];
			if (is_numeric($key) and floor($key) == ceil($key)) {
				$key = $key + $a;
			}
			$expression = str_replace('$'.$key, $p, $expression);
			$expression = str_replace('{{'.$key.'}}', $p, $expression);
		}
		$expression = str_replace('\\REAL_DOLLAR_SIGN\\', '\\$', $expression);
		return $expression;
	}
	
	/**
	 * Evaluates a string containing an expression,
	 * with possible references to parameters.
	 * CAUTION: make sure the expression is safe!!
	 * @method evalExpression
	 * @static
	 * @param {string} $expression
	 *  The code to eval.
	 * @param {array} $params=array()
	 *  Optional. An array of parameters to the expression.
	 *  Variable names in the expression can refer to them.
	 * @return {mixed}
	 *  The result of the expression
	 */
	static function evalExpression(
	 $expression,
	 $params = array())
	{
		if (is_array($params)) {
			extract($params);
		}
		@eval('$value = ' . $expression . ';');
		extract($params);
		/**
		 * @var $value
		 */
		return $value;
	}

	/**
	 * Use for surrounding text, so it can later be processed throughout.
	 * @method t
	 * @static
	 * @param {string} $text
	 * @return {string}
	 */
	static function t($text)
	{
		/**
		 * @event Q/t {before}
		 * @return {string}
		 */
		$text = Q::event('Q/t', array(), 'before', false, $text);
		return $text;
	}
	
	/**
	 * A convenience method to use in your PHP templates.
	 * It is short for Q_Html::text(Q::interpolate($expression, ...)).
	 * In Handlebars templates, you just use {{interpolate expression ...}}
	 * @method text
	 * @static
	 * @param {string} $expression Same as in Q::interpolate()
	 * @param {array} $params Same as in Q::interpolate()
	 * @param {string} [$convert=array()] Same as in Q_Html::text().
	 * @param {string} [$unconvert=array()] Same as in Q_Html::text().
	 */
	static function text($expression, $params = array(), $convert = array(), $unconvert = array())
	{
		return Q_Html::text(Q::interpolate($expression, $params), $convert, $unconvert);
	}

	/**
	 * Check if a file exists in the include path
	 * And if it does, return the absolute path.
	 * @method realPath
	 * @static
	 * @param {string} $filename
	 *  Name of the file to look for
	 * @param {boolean} $ignoreCache=false
	 *  Defaults to false. If true, then this function ignores
	 *  the cached value, if any, and attempts to search
	 *  for the file. It will cache the new value.
	 * @return {string|false}
	 *  The absolute path if file exists, false if it does not
	 */
	static function realPath (
		$filename,
		$ignoreCache = false)
	{
		$filename = str_replace('/', DS, $filename);
		if (!$ignoreCache) {
			// Try the extended cache mechanism, if any
			$result = Q::event('Q/realPath', array(), 'before');
			if (isset($result)) {
				return $result;
			}
			// Try the native cache mechanism
			$result = Q_Cache::get("Q::realPath\t$filename");
			if (isset($result)) {
				return $result;
			}
		}

		// Do a search for the file
	    $paths = explode(PS, get_include_path());
		array_unshift($paths, "");
		$result = false;
	    foreach ($paths as $path) {
			if (substr($path, -1) == DS) {
	        	$fullpath = $path.$filename;
			} else {
				$fullpath = ($path ? $path . DS : "") . $filename;
			}
			// Note: the following call to the OS may take some time:
			$realpath = realpath($fullpath);
			if ($realpath && file_exists($realpath)) {
	            $result = $realpath;
				break;
	        }
	    }

		// Notify the cache mechanism, if any
		Q_Cache::set("Q::realPath\t$filename", $result);
		/**
		 * @event Q/realPath {after}
		 * @param {string} $result
		 */
		Q::event('Q/realPath', compact('result'), 'after');

	    return $result;

	}

	/**
	 * Includes a file and evaluates code from it. Uses Q::realPath().
	 * @method includeFile
	 * @static
	 * @param {string} $filename
	 *  The filename to include
	 * @param {array} $params=array()
	 *  Optional. Extracts this array before including the file.
	 * @param {boolean} $once=false
	 *  Optional. Whether to use include_once instead of include.
	 * @param {boolean} $get_vars=false
	 *  Optional. If true, returns the result of get_defined_vars() at the end.
	 *  Otherwise, returns whatever the file returned.
	 * @return {mixed}
	 *  Depends on $get_vars
	 * @throws {Q_Exception_MissingFile}
	 *  May throw a Q_Exception_MissingFile exception.
	 */
	static function includeFile(
		$filename,
		array $params = array(),
		$once = false,
		$get_vars = false)
	{
		/**
		 * Skips includes to prevent recursion
		 * @event Q/includeFile {before}
		 * @param {string} filename
		 *  The filename to include
		 * @param {array} params
		 *  Optional. Extracts this array before including the file.
		 * @param {boolean} once
		 *  Optional. Whether to use include_once instead of include.
		 * @param {boolean} get_vars
		 *  Optional. Set to true to return result of get_defined_vars()
		 *  at the end.
		 * @return {mixed}
		 *  Optional. If set, override method return
		 */
		$result = self::event(
			'Q/includeFile',
			compact('filename', 'params', 'once', 'get_vars'),
			'before',
			true
		);
		if (isset($result)) {
			// return this result instead
			return $result;
		}

		$abs_filename = self::realPath($filename);

		if (!$abs_filename or is_dir($abs_filename)) {
			$include_path = get_include_path();
			require_once(Q_CLASSES_DIR.DS.'Q'.DS.'Exception'.DS.'MissingFile.php');
			throw new Q_Exception_MissingFile(compact('filename', 'include_path'));
		}

		extract($params);
		if ($get_vars === true) {
			if ($once) {
				if (!isset(self::$included_files[$filename])) {
					self::$included_files[$filename] = true;
					include_once($abs_filename);
				}
			} else {
				include($abs_filename);
			}
			return get_defined_vars();
		} else {
			if ($once) {
				if (!isset(self::$included_files[$filename])) {
					self::$included_files[$filename] = true;
					return include_once($abs_filename);
				}
			} else {
				return include($abs_filename);
			}
		}
	}

	/**
	 * Reads a file and caches it for a time period. Uses Q::realPath().
	 * @method readFile
	 * @static
	 * @param {string} $filename The name of the file to get the content of
	 * @param {array} $options
	 * @param {integer} [$options.duration=0] Number of seconds to cache it for
	 * @param {boolean} [$options.dontCache=false] whether to skip caching it
	 * @param {boolean} [$options.ignoreCache=false] whether to ignore already cached result
	 * @return {string} the content of the file
	 * @throws {Q_Exception_MissingFile}
	 *  May throw a Q_Exception_MissingFile exception.
	 */
	static function readFile(
		$filename,
		$options = array())
	{
		/**
		 * Skips includes to prevent recursion
		 * @event Q/readFile {before}
		 * @param {string} $filename The name of the file to get the content of
		 * @param {array} $options
		 * @param {integer} $options.duration Number of seconds to cache it for
		 * @param {boolean} $options.dontCache whether to skip caching it
		 * @param {boolean} $options.ignoreCache whether to ignore already cached result
		 * @return {string} Optional. If set, override method return
		 */
		$result = self::event(
			'Q/readFile',
			compact('filename', 'params', 'once', 'get_vars'),
			'before',
			true
		);
		if (isset($result)) {
			// return this result instead
			return $result;
		}
		
		$namespace = "Q::readFile\t$filename";
		if (empty($options['ignoreCache'])) {
			$result = Q_Cache::get('content', null, $namespace);
		}

		$abs_filename = self::realPath($filename);
		if (!$abs_filename or is_dir($abs_filename)) {
			$include_path = get_include_path();
			require_once(Q_CLASSES_DIR.DS.'Q'.DS.'Exception'.DS.'MissingFile.php');
			throw new Q_Exception_MissingFile(compact('filename', 'include_path'));
		}
		
		if (!isset($result)) {
			$result = file_get_contents($abs_filename);
		}
		if (empty($options['dontCache'])) {
			$duration = Q::ifset($options, 'duration', 0);
			Q_Cache::set('content', $result, $namespace);
			Q_Cache::setDuration($duration, $namespace);
		}
		return $result;
	}

	/**
	 * Default autoloader for Q
	 * @method autoload
	 * @static
	 * @param {string} $className
	 * @throws {Q_Exception_MissingClass}
	 *	If requested class is missing
	 */
	static function autoload(
	 $className)
	{
		if (class_exists($className, false)) {
			return;
		}
		try {
			$parts = array();
			$className_parts = explode('\\', $className);
			foreach ($className_parts as $part) {
				$parts = array_merge($parts, explode('_', $part));
			}
			$filename = 'classes'.DS.implode(DS, $parts).'.php';
			
			/**
			 * @event Q/autoload {before}
			 * @param {string} $className
			 * @return {string} the filename of the file to load
			 */
			$filename = self::event(
				'Q/autoload', compact('className'), 
				'before', false, $filename
			);

			// Now we can include the file
			try {
				self::includeFile($filename);
			} catch (Q_Exception_MissingFile $e) {
				// the file doesn't exist
				// and you will get an error if you try to use the class
			}

			// if (!class_exists($className) && !interface_exists($className)) {
			// 	require_once(Q_CLASSES_DIR.DS.'Q'.DS.'Exception'.DS.'MissingClass.php');
			// 	throw new Q_Exception_MissingClass(compact('className'));
			// }

			/**
			 * @event Q/autoload {after}
			 * @param {string} className
			 * @param {string} filename
			 */
			self::event('Q/autoload', compact('className', 'filename'), 'after');

		} catch (Exception $exception) {
			/**
			 * @event Q/exception
			 * @param {Exception} exception
			 */
			self::event('Q/exception', compact('exception'));
		}
	}

	/**
	 * Renders a particular view
	 * @method view
	 * @static
	 * @param {string} $viewName
	 *  The full name of the view
	 * @param {array} $params=array()
	 *  Parameters to pass to the view
	 * @return {string}
	 *  The rendered content of the view
	 * @throws {Q_Exception_MissingFile}
	 */
	static function view(
	 $viewName,
	 $params = array())
	{
		require_once(Q_CLASSES_DIR.DS.'Q'.DS.'Exception'.DS.'MissingFile.php');

		if (empty($params)) {
			$params = array();
		}

		$parts = explode('/', $viewName);
		$viewPath = implode(DS, $parts);
		if ($fields = Q_Config::get('Q', 'views', 'fields', null)) {
			$params = array_merge($fields, $params);
		}
		$params = array_merge(Q_Text::params($parts), $params);

		/**
		 * @event {before} Q/view
		 * @param {string} viewName
		 * @param {string} viewPath
		 * @param {string} params
		 * @return {string}
		 *  Optional. If set, override method return
		 */
		$result = self::event('Q/view', compact(
			'viewName', 'viewPath', 'params'
		), 'before');
		if (isset($result)) {
			return $result;
		}

		try {
			$ob = new Q_OutputBuffer();
			self::includeFile('views'.DS.$viewPath, $params);
			return $ob->getClean();
		} catch (Q_Exception_MissingFile $e) {
			if (basename($e->params['filename']) != basename($viewPath)) {
				throw $e;
			}
			$ob->flushHigherBuffers();
			/**
			 * Renders 'Missing View' page
			 * @event Q/missingView
			 * @param {string} viewName
			 * @param {string} viewpath
			 * @return {string}
			 */
			return self::event('Q/missingView', compact('viewName', 'viewPath', 'params'));
		}
	}

	/**
	 * Instantiates a particular tool.
	 * Also generates javascript around it.
	 * @method tool
	 * @static
	 * @param {string} $name
	 *  The name of the tool, of the form "$moduleName/$toolName"
	 *  The handler is found in handlers/$moduleName/tool/$toolName
	 *  Also can be an array of $toolName => $toolOptions, in which case the
	 *  following parameter, $options, is skipped.
	 * @param {array} $options=array()
	 *  The options passed to the tool (or array of options arrays passed to the tools).
	 * @param {array} [$extra=array()] Options used by Qbix when rendering the tool.
	 * @param {string} [$extra.id]
	 *    An additional ID to distinguish tools instantiated
	 *    side-by-side from each other, within the same parent HTMLElement.
	 * @param {string} [$extra.prefix]
	 *    Set a custom prefix for the tool's id
	 * @param {boolean} [$extra.cache=false]
	 *    If true, then the Qbix front end will not replace existing tools with same id
	 *    during Q.loadUrl when this tool appears in the rendered HTML
	 * @param {boolean} [$extra.merge=false]
	 *    If true, the element for this tool is merged with the element of the tool
	 *    already being rendered (if any), producing one element with markup
	 *    for both tools and their options. This can be used more than once, merging
	 *    multiple tools in one element.
	 *    As part of the mege, the content this tool (if any) is prepended
	 *    to the content of the tool which is already being rendered.
	 * @throws {Q_Exception_WrongType}
	 * @throws {Q_Exception_MissingFile}
	 */
	static function tool(
	 $name,
	 $options = array(),
	 $extra = array())
	{
		if (is_string($name)) {
			$info = array($name => $options);
		} else {
			$info = $name;
			$extra = $options;
		}
		
		$oldToolName = self::$toolName;
		
		/**
		 * @event Q/tool/render {before}
		 * @param {string} info
		 *  An array of $toolName => $options pairs
		 * @param {array} extra
		 *  Options used by Qbix when rendering the tool. Can include:<br/>
		 *  "id" =>
		 *    an additional ID to distinguish tools instantiated
		 *    side-by-side from each other. Usually numeric.<br/>
		 *  "cache" =>
		 *    if true, then the Qbix front end will not replace existing tools with same id
		 *    during Q.loadUrl when this tool appears in the rendered HTML
		 * @return {string|null}
		 *  If set, override the method return
		 */
		$returned = Q::event(
			'Q/tool/render',
			array('info' => $info, 'extra' => &$extra),
			'before'
		);
		$result = '';
		$exception = null;
		foreach ($info as $name => $options) {
			Q::$toolName = $name;
			$toolHandler = "$name/tool";
			$options = is_array($options) ? $options : array();
			if (is_array($returned)) {
				$options = array_merge($returned, $options);
			}
			try {
				/**
				 * Renders the tool
				 * @event $toolHandler
				 * @param {array} $options
				 *  The options passed to the tool
				 * @return {string}
				 *	The rendered tool content
				 */
				$result .= Q::event($toolHandler, $options); // render the tool
			} catch (Q_Exception_MissingFile $e) {
				/**
				 * Renders the 'Missing Tool' content
				 * @event Q/missingTool
				 * @param {array} name
				 *  The name of the tool
				 * @return {string}
				 *	The rendered content
				 */
				$params = $e->params();
				if ($params['filename'] === str_replace('/', DS, "handlers/$toolHandler.php")) {
					$result .= self::event('Q/missingTool', compact('name', 'options'));
				} else {
					$exception = $e;
				}
			} catch (Exception $e) {
				$exception = $e;
			}
			if ($exception) {
				Q::log($exception);
				$result .= $exception->getMessage();
			}
			Q::$toolName = $name; // restore the current tool name
		}
		// Even if the tool rendering throws an exception,
		// it is important to run the "after" handlers
		/**
		 * @event Q/tool/render {after}
		 * @param {string} info
		 *  An array of $toolName => $options pairs
		 * @param {array} 'extra'
		 *  Options used by Qbix when rendering the tool. Can include:<br/>
		 *  "id" =>
		 *    an additional ID to distinguish tools instantiated
		 *    side-by-side from each other. Usually numeric.<br/>
		 *  "cache" =>
		 *    if true, then the Qbix front end will not replace existing tools with same id
		 *    during Q.loadUrl when this tool appears in the rendered HTML
		 */
		Q::event(
			'Q/tool/render',
			compact('info', 'extra'),
			'after',
			false,
			$result
		);
		Q::$toolName = $oldToolName;
		return $result;
	}

	/**
	 * Fires a particular event.
	 * Might result in several handlers being called.
	 * @method event
	 * @static
	 * @param {string} $eventName
	 *  The name of the event
	 * @param {array} $params=array()
	 *  Parameters to pass to the event
	 * @param {boolean} $pure=false
	 *  Defaults to false.
	 *  If true, the handler of the same name is not invoked.
	 *  Put true here if you just want to fire a pure event,
	 *  without any default behavior.
	 *  If 'before', only runs the "before" handlers, if any.
	 *  If 'after', only runs the "after" handlers, if any.
	 *  You'd want to signal events with 'before' and 'after'
	 *  before and after some "default behavior" happens.
	 *  Check for a non-null return value on "before",
	 *  and cancel the default behavior if it is present.
	 * @param {boolean} $skipIncludes=false
	 *  Defaults to false.
	 *  If true, no new files are loaded. Only handlers which have
	 *  already been defined as functions are run.
	 * @param {reference} $result=null
	 *  Defaults to null. You can pass here a reference to a variable.
	 *  It will be returned by this function when event handling
	 *  has finished, or has been aborted by an event handler.
	 *  It is passed to all the event handlers, which can modify it.
	 * @return {mixed}
	 *  Whatever the default event handler returned, or the final
	 *  value of $result if it is modified by any event handlers.
	 * @throws {Q_Exception_Recursion}
	 * @throws {Q_Exception_MissingFile}
	 * @throws {Q_Exception_MissingFunction}
	 */
	static function event(
	 $eventName,
	 $params = array(),
	 $pure = false,
	 $skipIncludes = false,
	 &$result = null)
	{
		// for now, handle only event names which are strings
		if (!is_string($eventName)) {
			return;
		}
		if (!is_array($params)) {
			$params = array();
		}

		static $event_stack_limit = null;
		if (!isset($event_stack_limit)) {
			$event_stack_limit = Q_Config::get('Q', 'eventStackLimit', 100);
		}
		self::$event_stack[] = compact('eventName', 'params', 'pure', 'skipIncludes');
		++self::$event_stack_length;
		if (self::$event_stack_length > $event_stack_limit) {
			if (!class_exists('Q_Exception_Recursion', false)) {
				include(dirname(__FILE__).DS.'Q'.DS.'Exception'.DS.'Recursion.php');
			}
			throw new Q_Exception_Recursion(array('function_name' => "Q::event($eventName)"));
		}

		try {
			if ($pure !== 'after') {
				// execute the "before" handlers
				$handlers = Q_Config::get('Q', 'handlersBeforeEvent', $eventName, array());
				if (is_string($handlers)) {
					$handlers = array($handlers); // be nice
				}
				if (is_array($handlers)) {
					foreach ($handlers as $handler) {
						if (false === self::handle($handler, $params, $skipIncludes, $result)) {
							// return this result instead
							return $result;
						}
					}
				}
			}

			// Execute the primary handler, wherever that is
			if (!$pure) {
				// If none of the "after" handlers return anything,
				// the following result will be returned:
				$result = self::handle($eventName, $params, $skipIncludes, $result);
			}

			if ($pure !== 'before') {
				// execute the "after" handlers
				$handlers = Q_Config::get('Q', 'handlersAfterEvent', $eventName, array());
				if (is_string($handlers)) {
					$handlers = array($handlers); // be nice
				}
				if (is_array($handlers)) {
					foreach ($handlers as $handler) {
						if (false === self::handle($handler, $params, $skipIncludes, $result)) {
							// return this result instead
							return $result;
						}
					}
				}
			}
			array_pop(self::$event_stack);
			--self::$event_stack_length;
		} catch (Exception $e) {
			array_pop(self::$event_stack);
			--self::$event_stack_length;
			throw $e;
		}

		// If no handlers ran, the $result is still unchanged.
		return $result;
	}

	/**
	 * Tests whether a particular handler exists
	 * @method canHandle
	 * @static
	 * @param {string} $handler_name
	 *  The name of the handler. The handler can be overridden
	 *  via the include path, but an exception is thrown if it is missing.
	 * @param {boolean} $skip_include=false
	 *  Defaults to false. If true, no file is loaded;
	 *  the handler is executed only if the function is already defined;
	 *  otherwise, null is returned.
	 * @return {boolean}
	 *  Whether the handler exists
	 * @throws {Q_Exception_MissingFile}
	 */
	static function canHandle(
	 $handler_name,
	 $skip_include = false)
	{
		if (!isset($handler_name) || isset(self::$event_empty[$handler_name])) {
			return false;
		}
		$handler_name_parts = explode('/', $handler_name);
		$function_name = str_replace('-', '_', implode('_', $handler_name_parts));
		if (function_exists($function_name))
		 	return true;
		if ($skip_include)
			return false;
		// try to load appropriate file using relative filename
		// (may search multiple include paths)
		$filename = 'handlers'.DS.implode(DS, $handler_name_parts).'.php';
		try {
			self::includeFile($filename, array(), true);
		} catch (Q_Exception_MissingFile $e) {
			self::$event_empty[$handler_name] = true;
			return false;
		}
		return function_exists($function_name);

	}
	/**
	 * Executes a particular handler
	 * @method handle
	 * @static
	 * @param {string} $handler_name
	 *  The name of the handler. The handler can be overridden
	 *  via the include path, but an exception is thrown if it is missing.
	 * @param {array} $params=array()
	 *  Parameters to pass to the handler.
	 *  They may be altered by the handler, if it accepts $params as a reference.
	 * @param {boolean} $skip_include=false
	 *  Defaults to false. If true, no file is loaded;
	 *  the handler is executed only if the function is already defined;
	 *  otherwise, null is returned.
	 * @param {&mixed} $result=null
	 *  Optional. Lets handlers modify return values of events.
	 * @return {mixed}
	 *  Whatever the particular handler returned, or null otherwise;
	 * @throws {Q_Exception_MissingFunction}
	 */
	protected static function handle(
	 $handler_name,
	 &$params = array(),
	 $skip_include = false,
	 &$result = null)
	{
		if (!isset($handler_name)) {
			return null;
		}
		$handler_name_parts = explode('/', $handler_name);
		$function_name = str_replace('-', '_', implode('_', $handler_name_parts));
		if (!is_array($params)) {
			$params = array();
		}
		if (!function_exists($function_name)) {
			if ($skip_include) {
				return null;
			}
			// try to load appropriate file using relative filename
			// (may search multiple include paths)
			$filename = 'handlers'.DS.implode(DS, $handler_name_parts).'.php';
			self::includeFile($filename, $params, true);
			if (!function_exists($function_name)) {
				require_once(Q_CLASSES_DIR.DS.'Q'.DS.'Exception'.DS.'MissingFunction.php');
				throw new Q_Exception_MissingFunction(compact('function_name'));
			}
		}
		// The following avoids the bug in PHP where
		// call_user_func doesn't work with references being passed
		$args = array(&$params, &$result);
		return call_user_func_array($function_name, $args);
	}

	/**
	 * A replacement for call_user_func_array
	 * that implements some conveniences.
	 * @method call
	 * @static
	 * @param {callable} $callback
	 * @param {array} $params=array()
	 * @return {mixed}
	 *  Returns whatever the function returned.
	 * @throws {Q_Exception_MissingFunction}
	 */
	static function call(
		$callback,
		$params = array())
	{
		if ($callback === 'echo' or $callback === 'print') {
			foreach ($params as $p) {
				echo $p;
			}
			return;
		}
		if (!is_array($callback)) {
			$parts = explode('::', $callback);
			if (count($parts) > 1) {
				$callback = array($parts[0], $parts[1]);
			}
		}
		if (!is_callable($callback)) {
			$function_name = $callback;
			if (is_array($function_name)) {
				$function_name = implode('::', $function_name);
			}
			throw new Q_Exception_MissingFunction(compact('function_name'));
		}
		return call_user_func_array($callback, $params);
	}
	
	/**
	 * @method take
	 * @param {array|object} $source An array or object from which to take things.
	 * @param {array} $fields An array of fields to take or an associative array of fieldname => default pairs
	 * @param {array|object} &$dest Optional reference to an array or object in which we will set values.
	 *  Otherwise an empty array is used.
	 * @return {array|object} The $dest array or object, otherwise an array that has been filled with values.
	 */
	static function take($source, $fields, &$dest = null)
	{
		if (!is_array($fields)) {
			$fields = array($fields);
		}
		if (!isset($dest)) {
			$dest = array();
		}
		if (Q::isAssociative($fields)) {
			if (is_array($source)) {
				if (is_array($dest)) {
					foreach ($fields as $k => $v) {
						$dest[$k] = array_key_exists($k, $source) ? $source[$k] : $v;
					}
				} else {
					foreach ($fields as $k => $v) {
						$dest->$k = array_key_exists($k, $source) ? $source[$k] : $v;
					}
				}
			} else if (is_object($source)) {
				if (is_array($dest)) {
					foreach ($fields as $k => $v) {
						$dest[$k] = (property_exists($source, $k) or isset($source->$k)) ? $source->$k : $v;
				 	}
				} else {
					foreach ($fields as $k => $v) {
						$dest->$k = (property_exists($source, $k) or isset($source->$k)) ? $source->$k : $v;
				 	}
				}
			} else {
				if (is_array($dest)) {
					foreach ($fields as $k => $v) {
						$dest[$k] = $v;
					}
				} else {
					foreach ($fields as $k => $v) {
						$dest->$k = $v;
					}
				}
			}
		} else {
			if (is_array($source)) {
				if (is_array($dest)) {
					foreach ($fields as $k) {
						if (array_key_exists($k, $source)) {
							$dest[$k] = $source[$k];
						}
					}
				} else {
					foreach ($fields as $k) {
						if (array_key_exists($k, $source)) {
							$dest->$k = $source[$k];
						}
					}
				}
			} else if (is_object($source)) {
				if (is_array($dest)) {
					foreach ($fields as $k) {
						if (property_exists($source, $k) or isset($source->$k)) {
							$dest[$k] = $source->$k;
						}
					}
				} else {
					foreach ($fields as $k) {
						if (property_exists($source, $k) or isset($source->$k)) {
							$dest->$k = $source->$k;
						}
					}
				}
			} else {
				return $source;
			}
		}
		return $dest;
	}
	
	/**
	 * Determine whether a PHP array if associative or not
	 * Might be slow as it has to iterate through the array
	 * @param {array} $array
	 */
	static function isAssociative($array)
	{
		if (!is_array($array)) {
			return false;
		}
		
		// Keys of the array
		$keys = array_keys($array);

		// If the array keys of the keys match the keys, then the array must
		// not be associative (e.g. the keys array looked like {0:0, 1:1...}).
		return array_keys($keys) !== $keys;
	}
	
	/**
	 * If an array is not associative, then makes an associative array
	 * with the keys taken from the values of the regular array
	 * @param {array} $array
	 * @param {array} [$value=true] The value to assign to each item in the generated array
	 * @return {array}
	 */
	static function makeAssociative($array, $value = true)
	{
		if (Q::isAssociative($array)) {
			return $array;
		}
		$result = array();
		foreach ($array as $item) {
			$result[$item] = $value;
		}
		return $result;
	}

	/**
	 * Append a message to the main log
	 * @method log
	 * @static
	 * @param {mixed} $message
	 *  the message to append. Usually a string.
	 * @param {string} $key=null
	 *  The name of log file. Defaults to "$app_name.log"
	 * @param {bool} $timestamp=true
	 *  whether to prepend the current timestamp
	 * @param {array} $options
	 * @param {integer} [$options.maxLength=ini_get('log_errors_max_len')]
	 * @param {integer} [$options.maxDepth=3]
	 * @throws {Q_Exception_MissingFile}
	 *	If unable to create directory or file for the log
	 */
	static function log (
		$message,
		$key = null,
		$timestamp = true,
		$options = array())
	{
		if (is_array($timestamp)) {
			$options = $timestamp;
			$timestamp = true;
		}
		if (is_array($key)) {
			$options = $key;
			$key = null;
			$timestamp = true;
		}
		if (false === Q::event('Q/log', compact(
			'message', 'timestamp', 'error_log_arguments'
		), 'before')) {
			return;
		}

		if (!is_string($message)) {
			$maxDepth = Q::ifset($options, 'maxDepth', 3);
			if (!is_object($message)) {
				$message = Q::var_dump($message, $maxDepth, '$', 'text');
			} else if (!is_callable(array($message, '__toString'))) {
				$message = Q::var_dump($message, $maxDepth, '$', 'text');
			}
		}

		$app = Q_Config::get('Q', 'app', null);
		if (!isset($app)) {
			$app = defined('APP_DIR') ? basename(APP_DIR) : 'Q App';
		}
		$message = "(".(isset($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : "cli").") $app: $message";
		$max_len = Q::ifset($options, 'maxLength', 
			Q_Config::get('Q', 'log', 'maxLength', ini_get('log_errors_max_len'))
		);
		$path = (defined('APP_FILES_DIR') ? APP_FILES_DIR : Q_FILES_DIR)
			.DS.'Q'.DS.Q_Config::get('Q', 'internal', 'logDir', 'logs');

		$mask = umask(0000);
		if (!($realPath = Q::realPath($path))
		and !($realPath = Q::realPath($path, true))) {
			if (!@mkdir($path, 0777, true)) {
				throw new Q_Exception_FilePermissions(array('action' => 'create', 'filename' => $path, 'recommendation' => ' Please set the app files directory to be writable.'));
			}
			$realPath = Q::realPath($path, true);
		}
		$filename = (isset($key) ? $key : $app).'.log';
		$toSave = "\n".($timestamp ? '['.date('Y-m-d H:i:s') . '] ' : '') .substr($message, 0, $max_len);
		file_put_contents($realPath.DS.$filename, $toSave, FILE_APPEND);
		umask($mask);
	}

	/**
	 * Check if Qbix is ran as script
	 * @method textMode
	 * @static
	 * @return {boolean}
	 */
	static function textMode()
	{
		if (!isset($_SERVER['HTTP_HOST'])) {
			return true;
		}
		return false;
	}
	
	/**
	 * Helper function for cutting an array or object to a specific depth
	 * for stuff like json_encode in PHP versions < 5.5
	 * @param {mixed} $value to json encode
	 * @param {array} $options passed to json_encode
	 * @param {integer} $depth defaults to 10
	 * @param {mixed} $replace what to replace the cut off values with
	 */
	static function cutoff($value, $depth = 10, $replace = array())
	{
		if (!is_array($value) and !is_object($value)) {
			return $value;
		}
		$to_encode = array();
		foreach ($value as $k => $v) {
			$to_encode[$k] = ($depth > 0 ? self::cutoff($v, $depth-1) : $replace);
		}
		return $to_encode;
	}

	/**
	 * Dumps a variable.
	 * Note: cannot show protected or private members of classes.
	 * @method var_dump
	 * @static
	 * @param {mixed} $var
	 *  the variable to dump
	 * @param {integer} $max_levels=null
	 *  the maximum number of levels to recurse
	 * @param {string} $label='$'
	 *  optional - label of the dumped variable. Defaults to $.
	 * @param {boolean} $return_content=null
	 *  if true, returns the content instead of dumping it.
	 *  You can also set to "text" to return text instead of HTML
	 * @return {string|null}
	 */
	static function var_dump (
		$var,
		$max_levels = null,
		$label = '$',
		$return_content = null)
	{
		$scope = false;
		$prefix = 'unique';
		$suffix = 'value';
		$as_text = ($return_content === 'text') ? true : Q::textMode();

		if ($scope) {
			$vals = $scope;
		} else {
			$vals = $GLOBALS;
		}

		$old = $var;
		$var = $new = $prefix . rand() . $suffix;
		$vname = FALSE;
		foreach ($vals as $key => $val)
			if ($val === $new) // ingenious way of finding a global var :)
				$vname = $key;
		$var = $old;

		if ($return_content) {
			ob_start();
		}
		if ($as_text) {
			echo PHP_EOL;
		} else {
			echo "<pre style='margin: 0px 0px 10px 0px; display: block; background: white; color: black; font-family: Verdana; border: 1px solid #cccccc; padding: 5px; font-size: 10px; line-height: 13px;'>";
		}
		if (!isset(self::$var_dump_max_levels)) {
			self::$var_dump_max_levels = Q_Config::get('Q', 'var_dump_max_levels', 5);
		}
		$current_levels = self::$var_dump_max_levels;
		if (isset($max_levels)) {
			self::$var_dump_max_levels = $max_levels;
		}
		self::do_dump($var, $label . $vname, null, null, $as_text);
		if (isset($max_levels)) {
			self::$var_dump_max_levels = $current_levels;
		}
		if ($as_text) {
			echo PHP_EOL;
		} else {
			echo "</pre>";
		}

		if ($return_content) {
			return ob_get_clean();
		}
		return null;
	}
	
	private static function toArrays($value)
	{
		$result = (is_object($value) and method_exists($value, 'toArray'))
			? $value->toArray()
			: $value;
		if (is_array($result)) {
			foreach ($result as $k => &$v) {
				$v = self::toArrays($v);
			}
		}
		return $result;
	}
	
	/**
	 * A wrapper for json_encode
	 */
	static function json_encode($value, $options = 0, $depth = 512)
	{
		$args = func_get_args();
		$args[0] = self::toArrays($value);
		$result = call_user_func_array('json_encode', $args);
		if ($result === false) {
			if (is_callable('json_last_error')) {
				throw new Q_Exception_JsonEncode(array(
					'message' => json_last_error_msg()
				), null, json_last_error());
			}
			throw new Q_Exception_JsonEncode(array(
				'message' => 'Invalid JSON'
			), null, -1);
		}
		return str_replace("\\/", '/', $result);
	}


	/**
	 * A wrapper for json_decode
	 */
	static function json_decode()
	{
		$args = func_get_args();
		$result = call_user_func_array('json_decode', $args);
		if (is_callable('json_last_error')) {
			if ($code = json_last_error()) {
				throw new Q_Exception_JsonDecode(array(
					'message' => json_last_error_msg()
				), null, $code);
			}
		} else if (!isset($result) and strtolower(trim($args[0])) !== 'null') {
			throw new Q_Exception_JsonEncode(array(
				'message' => 'Invalid JSON'
			), null, -1);
		}
		return $result;
	}

	/**
	 * Exports a simple variable into something that looks nice, nothing fancy (for now)
	 * Does not preserve order of array keys.
	 * @method var_export
	 * @static
	 * @param {&mixed} $var
	 *  the variable to export
	 * @return {string}
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
				if (is_string($key)) {
					$keyed_values_quoted[] = "'" . addslashes($key) . "' => $value";
				} else {
					$indexed_values_quoted[] = $value;
				}
			}
			$parts = array();
			if (! empty($indexed_values_quoted))
				$parts['indexed'] = implode(', ', $indexed_values_quoted);
			if (! empty($keyed_values_quoted))
				$parts['keyed'] = implode(', ', $keyed_values_quoted);
			$exported = 'array(' . implode(", ".PHP_EOL, $parts) . ')';
			return $exported;
		} else {
			return var_export($var, true);
		}
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
	 * Parses a querystring like mb_parse_str but without converting some
	 * characters to underscores like PHP's version does
	 * @method parse_str
	 * @static
	 * @param {string} $str
	 * @param {reference} $arr reference to an array to fill, just like in parse_str
	 * @return {array} the resulting array of $field => $value pairs
	 */
	static function parse_str ($str, &$arr = null)
	{
		static $s = null, $r = null;
		if (!$s) {
			$s = array('.', ' ');
			$r = array('____DOT____', '____SPACE____');
			for ($i=128; $i<=159; ++$i) {
				$s[] = chr($i);
				$r[] = "____{$i}____";
			}
		}
		mb_parse_str(str_replace($s, $r, $str), $arr);
		return $arr = self::arrayReplace($r, $s, $arr);
	}
	
	/**
	 * Replaces strings in all keys and values of an array, and nested arrays
	 * @method parse_str
	 * @static
	 * @param {string} $search the first parameter to pass to str_replace
	 * @param {string} $replace the first parameter to pass to str_replace
	 * @param {array} $source the array in which the values are found
	 * @return {array} the resulting array
	 */
	static function arrayReplace($search, $replace, $source)
	{
		if (!is_array($source)) {
			return str_replace($search, $replace, $source);
		}
		$result = array();
		foreach ($source as $k => $v) {
			$k2 = str_replace($search, $replace, $k);
			$v2 = is_array($v)
				? self::arrayReplace($search, $replace, $v)
				: str_replace($search, $replace, $v);
			$result[$k2] = $v2;
		}
		return $result;
	}

	/**
	 * Returns stack of events currently being executed.
	 * @method eventStack
	 * @static
	 * @param {string} $eventName=null
	 *  Optional. If supplied, searches event stack for this event name.
	 *  If found, returns the latest call with this event name.
	 *  Otherwise, returns false
	 *
	 * @return {array|false}
	 */
	static function eventStack($eventName = null)
	{
		if (!isset($eventName)) {
			return self::$event_stack;
		}
		foreach (self::$event_stack as $key => $ei) {
			if ($ei['eventName'] === $eventName) {
				return $ei;
			}
		}
		return false;
	}

	/**
	 * Return backtrace
	 * @method backtrace
	 * @static
	 * @param {string} $pattern='$class::$function&#32;(from&#32;line&#32;$line)'
	 * @param {integer} $skip=2
	 */
	static function backtrace($pattern = '{{class}}::{{function}} (from line {{line}})', $skip = 2)
	{
		$result = array();
		$i = 0;
		foreach (debug_backtrace() as $entry) {
			if (++$i < $skip) {
				continue;
			}
			$entry['i'] = $i;
			foreach (array('class', 'line') as $k) {
				if (empty($entry[$k])) {
					$entry[$k] = '';
				}
			}
			$result[] = self::interpolate($pattern, $entry);
		}
		return $result;
	}

	/**
	 * Backtrace as html
	 * @method b
	 * @static
	 * @param {string} $separator=",&#32;<br>\n"
	 * @return {string}
	 */
	static function b($separator = ", <br>\n")
	{
		return implode($separator, Q::backtrace('{{i}}) {{class}}::{{function}} (from line {{line}})', 3));
	}

	/**
	 * @method test
	 * @param {string} $pattern
	 */
	static function test($pattern)
	{
		if (!is_string($pattern)) {
			return false;
		}
		Q::var_dump(glob($pattern));
		// TODO: implement
		exit;
	}

	/**
	 * Compares version strings in the format A.B.C...
	 * @method compareVersion
	 * @static
	 * @param {string} $a
	 * @param {string} $b
	 * @return {-1|0|1}
	 */
	static function compareVersion($a, $b)
	{
		if ($a && !$b) return 1;
		if ($b && !$a) return -1;
		if (!$a && !$b) return 0;
	    $a = explode(".", $a);
	    $b = explode(".", $b);
		$ca = count($a);
		for ($i = 0; $i < $ca; ++$i) {
			$ai = $a[$i];
			$bi = isset($b[$i]) ? intval($b[$i]) : 0;
            if ($ai > $bi) {
				return 1;
			}
			if ($ai < $bi) {
				return -1;
			}
		}
		$cb = count($b);
		for ($i = $ca; $i < $cb; ++$i) {
			if (intval($b[$i]) > 0) {
				return -1;
			}
		}
		return 0;
	}

	/**
	 * @method do_dump
	 * @static
	 * @private
	 * @param {&mixed} $var
	 * @param {string} $var_name=null
	 * @param {string} $indent=null
	 * @param {string} $reference=null
	 * @param {boolean} $as_text=false
	 */
	static private function do_dump (
		&$var,
		$var_name = NULL,
		$indent = NULL,
		$reference = NULL,
		$as_text = false)
	{
		static $n = null;
		if (!isset($n)) {
			$n = Q_Config::get('Q', 'newline', "
");
		}
		$do_dump_indent = $as_text
			? "  "
			: "<span style='color:#eeeeee;'>|</span> &nbsp;&nbsp; ";
		$reference = $reference . $var_name;
		$keyvar = 'the_do_dump_recursion_protection_scheme';
		$keyname = 'referenced_object_name';

		$max_indent = self::$var_dump_max_levels;
		if (strlen($indent) >= strlen($do_dump_indent) * $max_indent) {
			echo $indent . $var_name . " (...)$n";
			return;
		}

		if (is_array($var) && isset($var[$keyvar])) {
			$real_var = &$var[$keyvar];
			$real_name = &$var[$keyname];
			$type = ucfirst(gettype($real_var));
			if ($as_text) {
				echo "$indent$var_name<$type> = $real_name$n";
			} else {
				echo "$indent$var_name <span style='color:#a2a2a2'>$type</span> = <span style='color:#e87800;'>&amp;$real_name</span><br>";
			}
		} else {
			$var = array($keyvar => $var, $keyname => $reference);
			$avar = &$var[$keyvar];

			$type = ucfirst(gettype($avar));
			if ($type == "String") {
				$type_color = "green";
			} elseif ($type == "Integer") {
				$type_color = "red";
			} elseif ($type == "Double") {
				$type_color = "#0099c5";
				$type = "Float";
			} elseif ($type == "Boolean") {
				$type_color = "#92008d";
			} elseif ($type == "NULL") {
				$type_color = "black";
			} else {
				$type_color = '#92008d';
			}

			if (is_array($avar)) {
				$count = count($avar);
				if ($as_text) {
					echo "$indent" . ($var_name ? "$var_name => " : "")
						. "<$type>($count)$n$indent($n";
				} else {
					echo "$indent" . ($var_name ? "$var_name => " : "")
						. "<span style='color:#a2a2a2'>$type ($count)</span><br>$indent(<br>";
				}
				$keys = array_keys($avar);
				foreach ($keys as $name) {
					$value = &$avar[$name];
					$displayName = is_string($name)
						? "['" . addslashes($name) . "']"
						: "[$name]";
					self::do_dump($value, $displayName,
						$indent . $do_dump_indent, $reference, $as_text);
				}
				if ($as_text) {
					echo "$indent)$n";
				} else {
					echo "$indent)<br>";
				}
			} elseif (is_object($avar)) {
				$class = get_class($avar);
				if ($as_text) {
					echo "$indent$var_name<$type>[$class]$n$indent($n";
				} else {
					echo "$indent$var_name <span style='color:$type_color'>$type [$class]</span><br>$indent(<br>";
				}
				if ($avar instanceof Exception) {
					$code = $avar->getCode();
					$message = addslashes($avar->getMessage());
					echo "$indent$do_dump_indent"."code: $code, message: \"$message\"";
					if ($avar instanceof Q_Exception) {
						echo " inputFields: " . implode(', ', $avar->inputFields());
					}
					echo ($as_text ? $n : "<br />");
				}

				if (class_exists('Q_Tree')
				 and $avar instanceof Q_Tree) {
						$getall = $avar->getAll();
						self::do_dump($getall, "",
						$indent . $do_dump_indent, $reference, $as_text);
				} else if ($avar instanceof Q_Uri) {
					$arr = $avar->toArray();
					self::do_dump($arr, 'fields',
						$indent . $do_dump_indent, $reference, $as_text);
					self::do_dump($route_pattern, 'route_pattern',
						$indent . $do_dump_indent, $reference, $as_text);
				}

				if ($avar instanceof Db_Row) {
					foreach ($avar as $name => $value) {
						$modified = $avar->wasModified($name) ? "<span style='color:blue'>*</span>:" : '';
						self::do_dump($value, "$name$modified",
							$indent . $do_dump_indent, $reference, $as_text);
					}
				} else {
					foreach ($avar as $name => $value) {
						self::do_dump($value, "$name",
							$indent . $do_dump_indent, $reference, $as_text);
					}
				}

				if ($as_text) {
					echo "$indent)$n";
				} else {
					echo "$indent)<br>";
				}
			} elseif (is_int($avar)) {
				$avar_len = strlen((string)$avar);
				if ($as_text) {
					echo sprintf("$indent$var_name = <$type(%d)>$avar$n", $avar_len);
				} else {
					echo sprintf(
						"$indent$var_name = <span style='color:#a2a2a2'>$type(%d)</span>"
						. " <span style='color:$type_color'>$avar</span><br>",
						$avar_len
					);
				}
			} elseif (is_string($avar)) {
				$avar_len = strlen($avar);
				if ($as_text) {
					echo sprintf("$indent$var_name = <$type(%d)> ", $avar_len),
						$avar, "$n";
				} else {
					echo sprintf("$indent$var_name = <span style='color:#a2a2a2'>$type(%d)</span>",
						$avar_len)
						. " <span style='color:$type_color'>"
						. Q_Html::text($avar)
						. "</span><br>";
				}
			} elseif (is_float($avar)) {
				$avar_len = strlen((string)$avar);
				if ($as_text) {
					echo sprintf("$indent$var_name = <$type(%d)>$avar$n", $avar_len);
				} else {
					echo sprintf(
						"$indent$var_name = <span style='color:#a2a2a2'>$type(%d)</span>"
						. " <span style='color:$type_color'>$avar</span><br>",
						$avar_len);
				}
			} elseif (is_bool($avar)) {
				$v = ($avar == 1 ? "TRUE" : "FALSE");
				if ($as_text) {
					echo "$indent$var_name = <$type>$v$n";
				} else {
					echo "$indent$var_name = <span style='color:#a2a2a2'>$type</span>"
						. " <span style='color:$type_color'>$v</span><br>";
				}
			} elseif (is_null($avar)) {
				if ($as_text) {
					echo "$indent$var_name = NULL$n";
				} else {
					echo "$indent$var_name = "
						. " <span style='color:$type_color'>NULL</span><br>";
				}
			} else {
				$avar_len = strlen((string)$avar);
				if ($as_text) {
					echo sprintf("$indent$var_name = <$type(%d)>$avar$n", $avar_len);
				} else {
					echo sprintf("$indent$var_name = <span style='color:#a2a2a2'>$type(%d)</span>",
						$avar_len)
						. " <span style='color:$type_color'>"
						. gettype($avar)
						. "</span><br>";
				}
			}

			$var = $var[$keyvar];
		}
	}
	
	/**
	 * @method reverseLengthCompare
	 * @private
	 * @return {integer}
	 */
	protected static function reverseLengthCompare($a, $b)
	{
		return strlen($b)-strlen($a);
	}

	/**
	 * @property $included_files
	 * @type array
	 * @static
	 * @protected
	 */
	protected static $included_files = array();
	/**
	 * @property $var_dump_max_levels
	 * @type integer
	 * @static
	 * @protected
	 */
	protected static $var_dump_max_levels;

	/**
	 * @property $event_stack
	 * @type array
	 * @static
	 * @protected
	 */
	protected static $event_stack = array();
	/**
	 * @property $event_stack_length
	 * @type integer
	 * @static
	 * @protected
	 */
	protected static $event_stack_length = 0;
	/**
	 * @property $event_empty
	 * @type array
	 * @static
	 * @protected
	 */
	protected static $event_empty = array();

	/**
	 * @property $controller
	 * @type array
	 * @static
	 */
	static $controller = null;

	/**
	 * @property $state
	 * @type array
	 * @static
	 */
	static $state = array();
	/**
	 * @property $cache
	 * @type array
	 * @static
	 */
	public static $cache = array();

	/**
	 * This is set to true when the bootstrapping process has completed successfully.
	 * @property $bootstrapped
	 * @type boolean
	 * @static
	 */
	public static $bootstrapped = false;

	/**
	 * @property $toolName
	 * @type string
	 * @static
	 */
	public static $toolName = null;
	
	/**
	 * @property $toolWasRendered
	 * @type array
	 * @static
	 */
	public static $toolWasRendered = array();
}

if (!function_exists('json_last_error_msg')) {
    function json_last_error_msg() {
        static $ERRORS = array(
            JSON_ERROR_NONE => 'No error',
            JSON_ERROR_DEPTH => 'Maximum stack depth exceeded',
            JSON_ERROR_STATE_MISMATCH => 'State mismatch (invalid or malformed JSON)',
            JSON_ERROR_CTRL_CHAR => 'Control character error, possibly incorrectly encoded',
            JSON_ERROR_SYNTAX => 'Syntax error',
            JSON_ERROR_UTF8 => 'Malformed UTF-8 characters, possibly incorrectly encoded'
        );

        $error = json_last_error();
        return isset($ERRORS[$error]) ? $ERRORS[$error] : 'Unknown error';
    }
}

/// { aggregate classes for production
/// Q/*.php
/// Q/Exception/MissingFile.php
/// }
