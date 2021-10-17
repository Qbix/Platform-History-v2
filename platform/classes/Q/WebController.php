<?php

/**
 * @module Q
 */

/**
 * Web controller - excecutes web request
 * @class Q_WebController
 */
class Q_WebController
{
	/**
	 * Excecute web request
	 * @method execute
	 * @static
	 */
	static function execute()
	{
		// Fixes for different platforms:
		if (isset($_SERVER['HTTP_X_REWRITE_URL'])) { // ISAPI 3.0
			$_SERVER['REQUEST_URI'] = $_SERVER['HTTP_X_REWRITE_URL'];
		}
		if (ob_get_level()) {
			ob_end_clean();
		}
		
		// Get the base URL
		$base_url = Q_Request::baseUrl();
		if (Q::$controller === 'Q_ActionController') {
			// we detected action.php in the URL, but 
			// a misconfigured web server executed index.php instead
			return Q_ActionController::execute();
		}
		
		// Set the controller that is being used
		if (!isset(Q::$controller)) {
			Q::$controller = 'Q_WebController';
		}
		
		try {
			$slots = Q_Request::slotNames(false);
			$slots = $slots ? ' slots: ('.implode(',', $slots).') from' : '';
			$method = Q_Request::method();
			Q::log("$method$slots url: " . Q_Request::url(true),
				null, null, array('maxLength' => 10000)
			);
			Q_Dispatcher::dispatch();
			$dispatchResult = Q_Dispatcher::result();
			if (!isset($dispatchResult)) {
				$dispatchResult = 'Ran dispatcher';
			}
			$uri = Q_Request::uri();
			$module = $uri->module;
			$action = $uri->action;
			if ($module and $action) {
				$slotNames = Q_Request::slotNames();
				$returned_slots = empty($slotNames) 
					? '' 
					: implode(',', $slotNames);
				Q::log("~" . ceil(Q::milliseconds()) . 'ms+'
					. ceil(memory_get_peak_usage()/1000) . 'kb.'
					. " $dispatchResult for $module/$action"
					. " ($returned_slots)",
					null, null, array('maxLength' => 10000)
				);
			} else {
				Q::log("~" . ceil(Q::milliseconds()) . 'ms+'
					. ceil(memory_get_peak_usage()/1000) . 'kb.'
					. " $dispatchResult No route for " . $_SERVER['REQUEST_URI'],
					null, null, array('maxLength' => 10000)
				);
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
