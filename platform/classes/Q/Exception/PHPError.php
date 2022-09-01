<?php

/**
 * @module Q
 */
class Q_Exception_PHPError extends Q_Exception
{
	/**
	 * @class Q_Exception_PHPError
	 * @constructor
	 * @param {array} $params
	 *  The following values are expected:<br/>
	 *  "errstr" => the error message to display<br/>
	 *  "errfile" =><br/>
	 *  "errline" =><br/>
	 *  "fixTrace" => fixes the trace array to<br/>
	 * @param {array} $input_fields
	 *  Same as in Q_Exception.
	 */
	function __construct($params, $input_fields)
	{
		parent::__construct($params, $input_fields);
		if (!empty($params['fixTrace'])) {
			$this->fixTrace = true;
			if (isset($params['errfile']) && isset($params['errline'])) {
				$this->file = $params['errfile'];
				$this->line = $params['errline'];
			}
		}
		
		$errstr = $params['errstr'];
		$this->message = "(PHP error) $errstr";
		switch ($params['errno']) {
			case E_USER_ERROR:
				$this->message = "(PHP error) $errstr";
				break;
			case E_USER_WARNING:
				$this->warning = "(PHP warning) $errstr";
				break;
			case E_USER_NOTICE:
				$this->message = "(PHP notice) $errstr";
				break;
		}
	}

	/**
	 * @method getTraceEx
	 * @return {array}
	 */
	function getTraceEx()
	{
		$trace = parent::getTrace();
		return array_slice($trace, 3);
	}

	/**
	 * @method getTraceAsStringEx
	 * @return {string}
	 */
	function getTraceAsStringEx()
	{
		$str = parent::getTraceAsString();
		return implode("\n", array_slice(explode("\n", $str), 4));
	}

	/**
	 * @property $fixTrace
	 * @type boolean
	 * @protected
	 */
	protected $fixTrace = false;
};

Q_Exception::add('Q_Exception_PHPError', '(PHP error) {{errstr}}', 500);
