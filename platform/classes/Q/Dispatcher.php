<?php

/**
 * @module Q
 */
/**
 * This class lets you dispatch requests
 * @class Q_Dispatcher
 */
class Q_Dispatcher
{
	/**
	 * Returns the URI that is currently being dispatched.
	 * You should usually use this instead of Q_Request::uri(),
	 * as they may be different after a call to Q_Dispatcher::forward()
	 * @method uri
	 * @static
	 * @return {Q_Uri}
	 */
	static function uri()
	{
		if (isset(self::$uri)) {
			return self::$uri;
		}
		return Q_Request::uri();
	}
	
	/**
	 * Call this to tell the dispatcher to skip firing a certain event coming up
	 * @method skip
	 * @static
	 */
	static function skip($eventName)
	{
		self::$skip[$eventName] = true;
	}

	/**
	 * Forwards internally to a new URL, starting the dispatcher loop again
	 * @method forward
	 * @static
 	 * @param {mixed} $uri The URI to forward to, either as a string, an array or a Q_Uri object.
	 * @param {mixed} [$check=array('accessible')] Pass array() here to skip checking whether the URI can be obtained
	 *  as a result of routing some URL.
	 * @param {array} [$skip=null] Pass an array of events to avoid firing the next time through the dispatcher loop.
	 * @throws {Q_Exception_DispatcherForward}
	 * @throws {Q_Exception_WrongType}
	 */
	static function forward(
		$uri, 
		$check = array('accessible'),
		$skip = null)
	{
		if (!is_array($check)) {
			$check = array('accessible');
		}
		if (in_array('accessible', $check)) {
			if (! Q_Uri::url($uri)) {
				throw new Q_Exception_WrongType(array(
					'field' => '$uri',
					'range' => 'accessible destination'
				));
			}
		}
		
		// Throw an exception that only the dispatcher should catch.
		throw new Q_Exception_DispatcherForward(
			@compact('uri', 'skip')
		);
	}
	
	/**
	 * Forwards internally to the URI "$AppName/notFound", starting the dispatcher loop again
	 * @method forward
	 * @static
 	 * @param {mixed} $uri The URI to forward to, either as a string, an array or a Q_Uri object.
	 * @throws {Q_Exception_DispatcherForward}
	 * @throws {Q_Exception_WrongType}
	 */
	static function notFound()
	{
		$app = Q::app();
		self::forward("$app/notFound");
	}
	
	/**
	 * Stops processing the request and asks the dispatcher
	 * to jump straight to displaying the errors.
	 * @method showErrors
	 * @static
	 * @throws {Q_Exception_DispatcherErrors}
	 */
	static function showErrors()
	{
		// Throw an exception that only the dispatcher should catch.
		self::$handlingErrors = false;
		throw new Q_Exception_DispatcherErrors();
	}

	/**
	 * Used to get/set the result of the dispatching
	 * @method result
	 * @static
	 * @param {string} [$new_result=null] Pass a string here to record a result of the dispatching.
	 * @param {boolean} [$overwrite=false] If a result is already set, doesn't override it unless you pass true here.
	 */
	static function result($new_result = null, $overwrite = false)
	{
		static $result = null;
		if (isset($new_result)) {
			if (!isset($result) or $overwrite === true) {
				$result = $new_result;
			}
		}
		return $result;
	}
	
	/**
	 * Dispatches a URI for internal processing.
	 * Usually called by a front controller.
	 * @method dispatch
	 * @static
	 * @param {mixed} [$uri=null] You can pass a custom URI to dispatch. Otherwise, Qbix will attempt
	 *  to route the requested URL, if any.
	 * @param {array} [$check=array('accessible')] Pass array() to skip checking whether the URI can be obtained
	 *  as a result of routing some URL.
	 * @return {boolean}
	 * @throws {Q_Exception_MethodNotSupported}
	 * @throws {Q_Exception_Recursion}
	 * @throws {Q_Exception_DispatcherErrors}
	 * @throws {Q_Exception_DispatcherForward}
	 */
	static function dispatch(
		$uri = null, 
		$check = array('accessible'))
	{
		self::$startedDispatch = true;
		self::$servedResponse = false;
		
		if (!is_array($check)) {
			$check = array('accessible');
		}

		if (isset($uri)) {
			if (in_array('accessible', $check)) {
				if (! Q_Uri::url($uri)) {
					// We shouldn't dispatch to this URI
					$uri = Q_Uri::from(array());
				}
			}
			self::$uri = Q_Uri::from($uri);
		} else {
			$request_uri = Q_Request::uri();
			self::$uri = clone($request_uri);
		}
		$route = self::$uri->route();

		// if file or dir is requested, try to serve it
		$served = null;
		$filename = null;
		$skip = Q_Config::get('Q', 'dispatcherSkipFilename', false);
		$parts = $route ? explode('/', $route) : array();
		if (!$skip and strpos(end($parts), '.') === false) {
			// route didn't have a dot in it, try to serve a file
			$filename = Q_Request::filename(true);
		}
		if ($filename) {
			if (is_dir($filename)) {
				/**
				 * @event Q/dir
				 * @param {string} filename
				 * @param {string} routed_uri
				 * @return {boolean}
				 */
				$served = Q::event("Q/dir", @compact('filename', 'routed_uri'));
				$dir_was_served = true;
			} else if (file_exists($filename)) {
				/**
				 * @event Q/file
				 * @param {string} filename
				 * @param {string} routed_uri
				 * @return {boolean}
				 */
				$served = Q::event("Q/file", @compact('filename', 'routed_uri'));
				$dir_was_served = false;
			}
		}

		// if response or 404 was served, then return
		if (isset($served)) {
			self::$uri = null;
			self::result($dir_was_served ? "Dir served" : "File served");
			self::$served = $dir_was_served ? 'dir' : 'file';
			return true;
		}

		Q_Request::handleInput();
		
		Q_Text::setLanguageFromRequest();

		// if the Q service worker is requested, generate and serve it
		if (Q_Request::isServiceWorker()) {
			Q::event('Q/serviceWorker/response');
			self::result("Service Worker served");
			self::$served = 'serviceWorker';
			return true;
		}
		Q_Request::mergeCookieJS();

		// potentially redirect to a static file
		$sessionId = Q_Session::requestedId();
		if (empty($_SERVER['HTTP_X_QBIX_REQUEST'])) {
			$redirectKey = Q_Request::isAjax() ? 'json' : 'html';
			if (empty($sessionId)) {
				$redirectKey = 'landing';
			} else if (Q_Session::isAuthenticated()) {
				$redirectKey .= '.authenticated';
			}
			if ($redirectSuffix = Q_Config::get(
				'Q', 'static', 'redirect', $redirectKey, null
			) and $routesKey = Q_Config::get(
				'Q', 'static', 'generate', $redirectSuffix, 'routes', null
			) and $routes = Q_Config::get(
				'Q', 'static', 'routes', $routesKey, $route, null
			)) {
				$found = true;
				foreach (self::$uri->toArray() as $k => $v) {
					if (!isset($routes[$k])
					or !in_array($v, $routes[$k])) {
						if (!$k) {
							continue; // this is only used to define extra conditions for routes
						}
						$found = false;
						break;
					}
				}
				if ($found) {
					$querystrings = Q_Config::get('Q', 'static', 'querystrings', array());
					$qsname = '';
					foreach ($querystrings as $qsn => $qss) {
						foreach ($qss as $qs) {
							if (Q::startsWith($_SERVER['QUERY_STRING'], $qs)) {
								$qsname = "-$qsn";
								break 2;
							}
						}
					}
					Q_Session::start(); // set session cookie
					$normalized = Q_Utils::normalizeUrlToPath(Q_Request::url());
					$staticWebUrl = Q_Response::staticWebUrl();
					$redirectUrl = "$staticWebUrl/$normalized$qsname$redirectSuffix";
					$filename = Q_Html::themedFilename($redirectUrl);
					$mtime = filemtime($filename);
					$noRedirect = !$mtime;
					$duration = Q_Config::get('Q', 'static', 'duration', 0);
					if ($mtime and $duration) {
						$expires = $mtime + $duration;
						if (time() <= $expires) {
							header("Expires: $expires");
						} else {
							$noRedirect = true;
						}
					}
					if (!$noRedirect) {
						header("Location: $redirectUrl");
						self::response();
						return true;
					}
				}
			}
		}

		// This loop is for forwarding
		$max_forwards = Q_Config::get('Q', 'maxForwards', 10);
		for ($try = 0; $try < $max_forwards; ++$try) {

			// Make an array from the routed URI
			self::$routed = array();
			if (self::$uri instanceof Q_Uri) {
				self::$routed = self::$uri->toArray();
			}

			$module = null;
			try {
				// If no module was found, then respond with noModule and return
				if (!isset(self::$uri->module)) {
					/**
					 * Occurs when no module was found during routing.
					 * The parameters are the routed array
					 * @event Q/noModule
					 */
					Q::event("Q/noModule", self::$routed); // should echo things
					self::result("No module");
					self::$served = 'notFound';
					return false;
				}

				$module = self::$uri->module;

				// Implement restricting of modules we are allowed to access
				$routed_modules = Q_Config::get('Q', 'routedModules', null);
				if (isset($routed_modules)) {
					if (!in_array($module, $routed_modules)) {
						/**
						 * Occurs when no defined action was found during routing.
						 * The parameters are the routed array
						 * @event Q/notFound
						 * @param {array} $routed
						 */
						Q::event('Q/notFound', self::$routed); // should echo things
						self::result("Unknown module");
						self::$served = 'notFound';
						return false;
					}
				} else {
					if (!Q::realPath("handlers/$module")) {
						Q::event('Q/notFound', self::$routed); // should echo things
						self::result("Unknown module");
						self::$served = 'notFound';
						return false;
					}
				}
				
				// Implement notFound if action was not found
				if (empty(self::$uri->action)) {
					Q::event('Q/notFound', self::$routed); // should echo things
					self::result("Unknown action");
					self::$served = 'notFound';
					return false;
				}

				// Fire a pure event, for aggregation etc
				if (!isset(self::$skip['Q/prepare'])) {
					/**
					 * Gives the app a chance to prepare for handling a request
					 * The parameters are the routed array
					 * @event Q/prepare
					 * @param {array} $routed
					 */
					Q::event('Q/prepare', self::$routed, true);
				}
	
				// Perform validation
				if (!isset(self::$skip['Q/validate'])) {
					/**
					 * Gives the app a chance to validate the request and call
					 * Q_Response::addError() zero or more times.
					 * The parameters are the routed array
					 * @event Q/validate
					 * @param {array} $routed
					 */
					Q::event('Q/validate', self::$routed);
				}

				if ($try === 0) {
					self::cookies();
				}

				// We might want to reroute the request
				$eventName = 'Q/reroute';
				self::startSessionBeforeEvent($eventName);
				if (!isset(self::$skip[$eventName])) {
					/**
					 * Gives the app a chance to reroute the request
					 * @event Q/reroute
					 * @param {array} $routed
					 * @return {boolean} whether to stop the dispatch
					 */
					$stop_dispatch = Q::event($eventName, self::$routed, true);
					if ($stop_dispatch) {
						self::result("Stopped dispatch");
						self::$served = 'stopped';
						return false;
					}
				}
				
				// Time to instantiate some app objects from the request
				$eventName = 'Q/objects';
				self::startSessionBeforeEvent($eventName);
				if (!isset(self::$skip[$eventName])) {
					/**
					 * Gives the app a chance to fetch objects needed for handling
					 * the request.
					 * @event Q/objects
					 * @param {array} $routed
					 */
					Q::event($eventName, self::$routed, true);
				}

				$eventName = 'Q/errors';
				self::startSessionBeforeEvent($eventName);
				if (!isset(self::$skip[$eventName])) {
					// Check if any errors accumulated
					if (Q_Response::getErrors()) {
						// There were validation errors -- render a response
						self::result('Validation errors');
						self::$served = 'errors';
						self::errors(null, $module, null);
						return false;
					}
				}
				
				// Make some changes to server state, possibly
				$eventName = 'Q/method';
				self::startSessionBeforeEvent($eventName);
				$method = Q_Request::method();
				if ($method != 'GET') {
					$methods = Q_Config::get('Q', 'methods', array(
						'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'
					));
					if (!in_array($method, $methods)) {
						throw new Q_Exception_MethodNotSupported(@compact('method'));
					}
					$method_event = 'Q/'.strtolower($method);
					if (!isset(self::$skip[$eventName]) and !isset(self::$skip[$method_event])) {
						if (!Q::canHandle($method_event)) {
							throw new Q_Exception_MethodNotSupported(@compact('method'));
						}
						Q::event($method_event);
					}
				}
				
				$eventName = 'Q/errors';
				self::startSessionBeforeEvent($eventName);
				if (!isset(self::$skip[$eventName])) {
					// Check if any errors accumulated
					if (Q_Response::getErrors()) {
						// There were processing errors -- render a response
						self::result('Processing errors');
						self::$served = 'errors';
						self::errors(null, $module, null);
						return false;
					}
				}

				// You can gather some metrics here, and store them somewhere
				$eventName = 'Q/metrics';
				self::startSessionBeforeEvent($eventName);
				if (!isset(self::$skip[$eventName])) {
					/**
					 * Gives the app a chance to gather analytics from the request.
					 * @event Q/metrics
					 * @param {array} $routed
					 */
					Q::event($eventName, self::$routed, true);
				}
				
				// When handling all further events, you should probably
				// refrain from changing server state, and only do reading.
				// That is because GET in HTTP is not supposed to have side effects
				// for which the client is responsible.

				self::response();

				return true;
			} catch (Q_Exception_DispatcherForward $e) {
				if (!empty($ob)) {
					$ob->getClean();
				}
				self::handleForwardException($e);
			} catch (Q_Exception_DispatcherErrors $e) {
				if (!empty($ob)) {
					$partialResponse = $ob->getClean();
				} else {
					$partialResponse = null;
				}
				self::errors(null, $module, $partialResponse);
				self::result("Rendered errors");
				self::$served = 'errors';
				return true;	
			} catch (Exception $exception) {
				if (!empty($ob)) {
					$partialResponse = $ob->getClean();
				} else {
					$partialResponse = null;
				}
				$message = $exception->getMessage();
				$file = $exception->getFile();
				$line = $exception->getLine();
				if (is_callable(array($exception, 'getTraceAsStringEx'))) {
					$trace_string = $exception->getTraceAsStringEx();
				} else {
					$trace_string = $exception->getTraceAsString();
				}
				$colored = Q_Exception::coloredString(
					$message, $file, $line, $trace_string
				);
				self::result("Exception occurred:\n\n$colored");
				self::$served = 'errors';
				try {
					self::errors($exception, $module, $partialResponse);
				} catch (Exception $e) {
					if (!empty($forwarding_to_error_action)) {
						// Looks like there were errors in the error action
						// So show the default one with the original exception
						throw $exception;
					}
					if (get_class($e) === 'Q_Exception_DispatcherForward') {
						$forwarding_to_error_action = true;
						self::handleForwardException($e);
						continue;
					} else {
						throw $e;
					}
				}
				return false;
			}
		}
		
		// If we are here, we have done forwarding too much
		throw new Q_Exception_Recursion(array(
			'function_name' => 'Dispatcher::forward()'
		));
	}

	/**
	 * Set some standard cookies for the client
	 * @method cookies
	 * @static
	 */
	static function cookies()
	{
		// Set cookies from GET parameters, if they were set
		if (!empty($_GET['Q_ct'])) {
			Q_Response::setCookie('Q_ct', $_GET['Q_ct']);
		}
		if (!empty($_GET['Q_cordova'])) {
			Q_Response::setCookie('Q_cordova', $_GET['Q_cordova']);
		}
		// Set cookie from latest update timestamp, if it was set
		if ($Q_ut = Q::ifset(Q_Uri::$urls, '@timestamp', null)) {
			Q_Response::setCookie('Q_ut', $Q_ut);
		}
	}
	
	/**
	 * Returns a response to the client.
	 * @param {boolean} [$closeConnection=false] Whether to flush all the buffers
	 *   and send headers to close the connection
	 * @param {boolean} [$flushBuffers=false] Whether to flush the buffers
	 * @method response
	 * @static
	 */
	static function response($closeConnection = false)
	{
		if (self::$servedResponse) {
			return; // response was served, and no new dispatch started
		}
		
		// Start buffering the response, unless otherwise requested
		$handler = Q_Response::isBuffered();
		if ($handler !== false) {
			$ob = new Q_OutputBuffer($handler);
		}
		
		Q_Response::sendCookieHeaders();

		// Generate and render a response
		/**
		 * Gives the app a chance to generate a response.
		 * You should not change the server state when handling this event.
		 * @event Q/response
		 * @param {array} $routed
		 */
		$eventName = 'Q/response';
		self::startSessionBeforeEvent($eventName);
		self::$startedResponse = true;
		if (!isset(self::$skip[$eventName])) {
			Q::event($eventName, self::$routed);
		}
		if ($closeConnection) {
			header("Connection: close");
			header("Content-Length: ".$ob->getLength());
		}
		if (!empty($ob)) {
			$ob->endFlush();
		}
		if ($closeConnection) {
			@ob_end_flush();
			$ob = new Q_OutputBuffer();
			for ($i=0, $l=$ob->level; $i<=$l; ++$i) {
				@ob_end_flush();
			}
			flush();
		}
		self::$servedResponse = true;
		self::result("Served response");
		self::$served = 'response';
		return true;
	}

	private static function startSessionBeforeEvent($eventName)
	{
		static $startBeforeEventName = null;
		if (!$startBeforeEventName) {
			$startBeforeEventName = Q_Config::get('Q', 'session', 'startBefore', false);
		}
		if (self::$startedResponse) {
			return false; // too late to start a session
		}
		// start the session and set a nonce
		if (!empty($_SERVER['HTTP_HOST'])
		and $startBeforeEventName === $eventName) {
			Q_Session::setNonce();
			Q_Text::setLanguageFromRequest(); // may update it
		}
		return true;
	}
	
	/**
	 * @method errors
	 * @static
	 * @protected
	 * @param {Exception} $exception
	 * @param {string} $module
	 * @param {string} [$partialResponse=null]
	 */
	protected static function errors(
		$exception, 
		$module, 
		$partialResponse = null)
	{
		self::$errorsOccurred = true;
		$startedResponse = self::$startedResponse;
		if (!$startedResponse) {
			Q_Response::sendCookieHeaders();
		}
		$errors = Q_Response::getErrors();
		Q::$toolWasRendered = array();
		try {
			if (self::$handlingErrors) {
				// We need to handle errors, but we
				// have already tried to do it.
				// Just show the errors view.
				Q::event('Q/errors/native', @compact('errors', 'exception', 'partialResponse', 'startedResponse'));
				return;
			}
			self::$handlingErrors = true;
			
			$header = isset($exception->header)
				? $exception->header
				: (isset($exception->httpResponseCode)
					? $exception->httpResponseCode
					: 412);
			if (is_numeric($header)) {
				http_response_code($header);
			} else if (is_string($header)) {
				header($header);
			}
		
			if (Q::canHandle("$module/errors")) {
				/**
				 * @event $module/errors
				 * @param {Exception} exception
				 * @param {string} module
				 * @param {string} partialResponse
				 */
				Q::event("$module/errors", @compact('errors', 'exception', 'partialResponse', 'startedResponse'));
			} else {
				/**
				 * @event Q/errors
				 * @param {Exception} exception
				 * @param {string} module
				 * @param {string} partialResponse
				 */
				Q::event("Q/errors", @compact('errors', 'exception', 'partialResponse', 'startedResponse'));
			}
		} catch (Exception $e) {
			Q_Exception::rethrow($e, ''); // may be for forwarding
			/**
			 * @event Q/exception
			 * @param {Exception} exception
			 */
			Q::event('Q/exception', @compact('exception')); // the original exception
		}
	}

	protected static function handleForwardException($e)
	{
		$slotNames = Q_Request::slotNames(true);
		foreach ($slotNames as $slotName) {
			Q_Response::clearSlot($slotName);
		}
		// Go again, this time with a different URI.
		Q::$toolWasRendered = array();
		self::$uri = Q_Uri::from($e->uri);
		if (is_array($e->skip)) {
			self::$skip = $e->skip;
		} else {
			// Don't process any non-GET methods this time around,
			// Do not collect any metrics
			// And also ignore any accumulated errors
			self::$skip = array(
				'Q/method' => true,
				'Q/metrics' => true,
				'Q/errors' => true
			);
		}
		// We'll be handling errors anew
		self::$handlingErrors = false;
	}
	
	/**
	 * @property $uri
	 * @type Q_Uri
	 * @static
	 * @protected
	 */
	protected static $uri;

	/**
	 * Set to "file", "dir", or "response"
	 * @property $served
	 * @type string
	 * @static
	 * @protected
	 */
	public static $served;

	/**
	 * @property $skip
	 * @type array
	 * @static
	 * @protected
	 */
	protected static $skip = array();
	/**
	 * @property $handlingErrors
	 * @type boolean
	 * @static
	 * @protected
	 */
	protected static $handlingErrors = false;
	/**
	 * @property $errorsOccurred
	 * @type boolean
	 * @static
	 * @protected
	 */
	protected static $errorsOccurred = false;
	/**
	 * Whether the dispatch method was called since the beginning of the request
	 * @property @startedDispatch
	 * @type boolean
	 * @static
	 * @public
	 */
	public static $startedDispatch = false;
	/**
	 * Whether a response was started, since the beginning of the request
	 * @property $startedResponse
	 * @type boolean
	 * @static
	 * @public
	 */
	public static $startedResponse = false;
	/**
	 * Whether a response was served since the last time dispatch started
	 * @property $servedResponse
	 * @type boolean
	 * @static
	 * @public
	 */
	public static $servedResponse = false;
	/**
	 * @property $routed
	 * @type array
	 * @static
	 * @public
	 */
	public static $routed = null;
}
