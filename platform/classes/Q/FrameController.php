<?php

/**
 * @module Q
 */

/**
 * Frame controller - excecutes web iframe request
 * @class Q_FrameController
 */
class Q_FrameController
{
	/**
	 * Execute web iframe request
	 * @method execute
	 * @static
	 */
	static function execute()
	{
		if (!isset(Q::$controller)) {
			Q::$controller = 'Q_FrameController';
		}
		return Q_WebController::execute();
	}
}
