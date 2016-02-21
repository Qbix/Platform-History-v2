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
			compact('uri', 'skip')
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
		$app = Q_Config::expect('Q', 'app');
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
		self::$handling_errors = false;
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

		// if file or dir is requested, try to serve it
		$served = false;
		$skip = Q_Config::get('Q', 'dispatcherSkipFilename', false);
		$filename = $skip ? false : Q_Request::filename();
		if ($filename) {
			if (is_dir($filename)) {
				/**
				 * @event Q/dir
				 * @param {string} filename
				 * @param {string} routed_uri
				 * @return {boolean}
				 */
				$served = Q::event("Q/dir", compact('filename', 'routed_uri'));
				$dir_was_served = true;
			} else {
				/**
				 * @event Q/file
				 * @param {string} filename
				 * @param {string} routed_uri
				 * @return {boolean}
				 */
				$served = Q::event("Q/file", compact('filename', 'routed_uri'));
				$dir_was_served = false;
			}
		}

		// if response was served, then return
		if ($served) {
			self::result($dir_was_served ? "Dir served" : "File served");
			return true;
		}

		// This loop is for forwarding
		$max_forwards = Q_Config::get('Q', 'maxForwards', 10);
		for ($try = 0; $try < $max_forwards; ++$try) {

			// Make an array from the routed URI
			$routed_uri_array = array();
			if (self::$uri instanceof Q_Uri) {
				$routed_uri_array = self::$uri->toArray();
			}

			// If no module was found, then respond with noModule and return
			if (!isset(self::$uri->module)) {
				/**
				 * @event Q/noModule
				 * @param {array} $routed_uri_array
				 */
				Q::event("Q/noModule", $routed_uri_array); // should echo things
				self::result("No module");
				return false;
			}
			
			$module = self::$uri->module;

			try {
				// Implement restricting of modules we are allowed to access
				$routed_modules = Q_Config::get('Q', 'routedModules', null);
				if (isset($routed_modules)) {
					if (!in_array($module, $routed_modules)) {
						/**
						 * @event Q/notFound
						 * @param {array} $routed_uri_array
						 */
						Q::event('Q/notFound', $routed_uri_array); // should echo things
						self::result("Unknown module");
						return false;
					}
				} else {
					if (!Q::realPath("handlers/$module")) {
						Q::event('Q/notFound', $routed_uri_array); // should echo things
						self::result("Unknown module");
						return false;
					}
				}
				
				// Implement notFound if action was not found
				if (empty(self::$uri->action)) {
					Q::event('Q/notFound', $routed_uri_array); // should echo things
					self::result("Unknown action");
					return false;
				}

				// Fire a pure event, for aggregation etc
				if (!isset(self::$skip['Q/prepare'])) {
					/**
					 * @event Q/prepare
					 * @param {array} $routed_uri_array
					 */
					Q::event('Q/prepare', $routed_uri_array, true);
				}
	
				// Perform validation
				if (!isset(self::$skip['Q/validate'])) {
					/**
					 * @event Q/validate
					 * @param {array} $routed_uri_array
					 */
					Q::event('Q/validate', $routed_uri_array);
				
					if (!isset(self::$skip['Q/errors'])) {
						// Check if any errors accumulated
						if (Q_Response::getErrors()) {
							// There were validation errors -- render a response
							self::result('Validation errors');
							self::errors(null, $module, null);
							return false;
						}
					}
				}
				
				// Time to instantiate some app objects from the request
				if (!isset(self::$skip['Q/objects'])) {
					/**
					 * @event Q/objects
					 * @param {array} $routed_uri_array
					 */
					Q::event('Q/objects', $routed_uri_array, true);
				}
				
				// We might want to reroute the request
				if (!isset(self::$skip['Q/reroute'])) {
					/**
					 * @event Q/reroute
					 * @param {array} $routed_uri_array
					 * @return {boolean} whether to stop the dispatch
					 */
					$stop_dispatch = Q::event('Q/reroute', $routed_uri_array, true);
					if ($stop_dispatch) {
						self::result("Stopped dispatch");
						return false;
					}
				}
				// Make some changes to server state, possibly
				$method = Q_Request::method();
				if ($method != 'GET') {
					$methods = Q_Config::get('Q', 'methods', array('POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'));
					if (!in_array($method, $methods)) {
						throw new Q_Exception_MethodNotSupported(compact('method'));
					}
					$method_event = 'Q/'.strtolower($method);
					if (!isset(self::$skip['Q/method']) and !isset(self::$skip[$method_event])) {
						if (!Q::canHandle($method_event)) {
							throw new Q_Exception_MethodNotSupported(compact('method'));
						}
						Q::event($method_event);
					}
				}

				// You can calculate some analytics here, and store them somewhere
				if (!isset(self::$skip['Q/analytics'])) {
					/**
					 * @event Q/analytics
					 * @param {array} $routed_uri_array
					 */
					Q::event('Q/analytics', $routed_uri_array, true);
				}
				
				if (!isset(self::$skip['Q/errors'])) {
					// Check if any errors accumulated
					if (Q_Response::getErrors()) {
						// There were processing errors -- render a response
						self::result('Processing errors');
						self::errors(null, $module, null);
						return false;
					}
				}
				
				// When handling all further events, you should probably
				// refrain from changing server state, and only do reading.
				// That is because GET in HTTP is not supposed to have side effects
				// for which the client is responsible.

				// Start buffering the response, unless otherwise requested
				$handler = Q_Response::isBuffered();
				if ($handler !== false) {
					$ob = new Q_OutputBuffer($handler);
				}

				// Generate and render a response
				/**
				 * @event Q/response
				 * @param {array} $routed_uri_array
				 */
				self::$response_started = true;
				Q::event("Q/response", $routed_uri_array);
				if (!empty($ob)) {
					$ob->endFlush();
				}

				self::result("Served response");
				return true;
			} catch (Q_Exception_DispatcherForward $e) {
				if (!empty($ob)) {
					$ob->getClean();
				}
				self::handleForwardException($e);
			} catch (Q_Exception_DispatcherErrors $e) {
				if (!empty($ob)) {
					$partial_response = $ob->getClean();
				} else {
					$partial_response = null;
				}
				self::errors(null, $module, $partial_response);
				self::result("Rendered errors");
				return true;	
			} catch (Exception $exception) {
				if (!empty($ob)) {
					$partial_response = $ob->getClean();
				} else {
					$partial_response = null;
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
				try {
					self::errors($exception, $module, $partial_response);
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
	 * @method errors
	 * @static
	 * @protected
	 * @param {Exception} $exception
	 * @param {string} $module
	 * @param {string} [$partial_response=null]
	 */
	protected static function errors(
		$exception, 
		$module, 
		$partial_response = null)
	{
		self::$errors_occurred = true;
		$response_started = self::$response_started;
		$errors = Q_Response::getErrors();
		Q::$toolWasRendered = array();
		try {
			if (self::$handling_errors) {
				// We need to handle errors, but we
				// have already tried to do it.
				// Just show the errors view.
				Q::event('Q/errors/native', compact('errors', 'exception', 'partial_response', 'response_started'));
				return;
			}
			self::$handling_errors = true;
		
			if (Q::canHandle("$module/errors")) {
				/**
				 * @event $module/errors
				 * @param {Exception} exception
				 * @param {string} module
				 * @param {string} partial_response
				 */
				Q::event("$module/errors", compact('errors', 'exception', 'partial_response', 'response_started'));
			} else {
				/**
				 * @event Q/errors
				 * @param {Exception} exception
				 * @param {string} module
				 * @param {string} partial_response
				 */
				Q::event("Q/errors", compact('errors', 'exception', 'partial_response', 'response_started'));
			}
		} catch (Exception $e) {
			Q_Exception::rethrow($e, ''); // may be for forwarding
			/**
			 * @event Q/exception
			 * @param {Exception} exception
			 */
			Q::event('Q/exception', compact('exception')); // the original exception
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
			// Do not collect any analytics
			// And also ignore any accumulated errors
			self::$skip = array(
				'Q/method' => true,
				'Q/analytics' => true,
				'Q/errors' => true
			);
		}
		// We'll be handling errors anew
		self::$handling_errors = false;
	}
	
	/**
	 * @property $uri
	 * @type Q_Uri
	 * @static
	 * @protected
	 */
	protected static $uri;
	/**
	 * @property $skip
	 * @type array
	 * @static
	 * @protected
	 */
	protected static $skip = array();
	/**
	 * @property $handling_errors
	 * @type boolean
	 * @static
	 * @protected
	 */
	protected static $handling_errors = false;
	/**
	 * @property $errors_occurred
	 * @type boolean
	 * @static
	 * @protected
	 */
	protected static $errors_occurred = false;
	/**
	 * @property $response_started
	 * @type boolean
	 * @static
	 * @protected
	 */
	protected static $response_started = false;
}
