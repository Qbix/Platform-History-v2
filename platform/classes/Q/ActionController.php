<?php

/**
 * @module Q
 */
/**
 * The standard action front controller
 * @class Q_ActionController
 */
class Q_ActionController
{
	/**
	 * The standard action front controller
	 * @method execute
	 * @static
	 * @throws {Q_Exception_BadUrl}
	 * @throws {Q_Exception}
	 * @throws {Q_Exception_MissingConfig}
	 */
	static function execute($url = null)
	{
		// Fixes for different platforms:
		if (isset($_SERVER['HTTP_X_REWRITE_URL'])) { // ISAPI 3.0
			$_SERVER['REQUEST_URI'] = $_SERVER['HTTP_X_REWRITE_URL'];
		}
		
		// Set the controller that is being used
		if (!isset(Q::$controller)) {
			Q::$controller = 'Q_ActionController';
		}
		
		try {
			$slots = Q_Request::slotNames(false);
			$slots = $slots ? ' slots: ('.implode(',', $slots).') from' : '';
			$method = Q_Request::method();
			Q::log("$method$slots url: " . Q_Request::url(true));
			$tail =  Q_Request::tail($url);
			if (!isset($tail)) {
				// Bad url was requested somehow
				$url = Q_Request::url(true);
				$base_url = Q_Request::baseUrl(true);
				throw new Q_Exception_BadUrl(@compact('base_url', 'url'));
			}
			$parts = explode('/', $tail);
			$parts_len = count($parts);
			if ($parts_len >= 1) {
				$module = $parts[0];
			}
			if ($parts_len >= 2) {
				$action = $parts[1];
			}

			if (empty($module) or empty($action)) {
				throw new Q_Exception("Not implemented");
			}
			
			// Make sure the 'Q'/'web' config fields are set,
			// otherwise URLs will be formed pointing to the wrong
			// controller script.
			$ar = Q_Config::get('Q', 'web', 'appRootUrl', null);
			if (!isset($ar)) {
				throw new Q_Exception_MissingConfig(array(
					'fieldpath' => 'Q/web/appRootUrl'
				));
			}
						
			// Dispatch the request
			$uri = Q_Uri::from(@compact('module', 'action'));
			Q_Dispatcher::dispatch($uri);
			$dispatchResult = Q_Dispatcher::result();
			if (!isset($dispatchResult)) {
				$dispatchResult = 'Ran dispatcher';
			}
			if ($module and $action) {
				$slotNames = Q_Request::slotNames();
				$requestedSlots = empty($slotNames) 
					? '' 
					: implode(',', $slotNames);
				Q::log("~" . ceil(Q::milliseconds()) . 'ms+'
					. ceil(memory_get_peak_usage()/1000) . 'kb.'
					. " $dispatchResult for $module/$action"
					. " ($requestedSlots)"
				);
			} else {
				Q::log("~" . ceil(Q::milliseconds()) . 'ms+'
					. ceil(memory_get_peak_usage()/1000) . 'kb.'
					. " No route for " . $_SERVER['REQUEST_URI']);
			}
		} catch (Exception $exception) {
			/**
			 * @event Q/exception
			 * @param {Exception} exception
			 */
			Q::event('Q/exception', @compact('exception'));
		}
	}
}
