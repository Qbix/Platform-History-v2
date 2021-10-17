<?php

/**
 * @module Q
 */
class Q_Exception extends Exception
{	
	/**
	 * Represents a complex exception thrown in Q. It may contain more details.
	 * @class Q_Exception
 	 * @constructor
	 * @extends Exception
	 * @param {array} [$params=array()] Array of parameters for the exception. 
	 *  Used in the exception message, etc.
	 *  To access them later, call $e->params()
	 *  You can also provide a string here, which will
	 *  then be the exception message.
	 * @param {array} [$inputFields=array()] Array of names of input fields to which the exception applies.
	 * @param {array} [$code=null] Optionally pass the error code here to override the default
	 */
	function __construct(
	  $params = array(),
	  $inputFields = array(),
	  $code = null,
	  $file = null,
	  $line = null,
	  $trace = null,
	  $traceAsString = null)
	{
		if (is_string($inputFields)) {
			$inputFields = array($inputFields);
		}
		$this->inputFields = $inputFields;
		if (isset($file)) {
			$this->file = $file;
		}
		if (isset($line)) {
			$this->line = $line;
		}
		if (isset($trace)) {
			$this->trace = $trace;
		}
		if (isset($traceAsString)) {
			$this->traceAsString = $traceAsString;
		}
		
		if (is_string($params)) {
			parent::__construct($params, is_numeric($code) ? $code : -1);
			if (isset($code)) {
				$this->code = $code; // Q_Exception allows non-numeric codes
			}
			return;
		}
		$this->params = is_array($params) ? $params : array();

		$className = get_class($this);
		$message = isset(self::$messages[$className])
			? Q::interpolate(self::$messages[$className], $this->params)
			: $className;
		$code = isset($code) ? $code : 
			(isset(self::$codes[$className]) ? self::$codes[$className] : 1);
		$this->header = isset(self::$headers[$className])
			? self::$headers[$className]
			: 412; // our catch-all HTTP error code
		parent::__construct($message, $code);
	}
	
	/**
	 * Construct a Q_Exception object from an Exception.
	 * @method $exception
	 * @param $exception
	 * @return {Q_Exception}
	 */
	static function fromException($exception)
	{
		$result = new Q_Exception();
		$fields = get_object_vars($exception);
		foreach ($fields as $k => $v) {
			$result->$k = $v;
		}
		return $result;
	}
	
	/**
	 * @method __get
	 * @param {string} $param
	 * @return {mixed}
	 */
	function __get($param)
	{
		return isset($this->params[$param])
			? $this->params[$param]
			: null;
	}
	
	/**
	 * @method __set
	 * @param {string} $param
	 * @param {mixed} $value
	 */
	function __set($param, $value) {
		$this->params[$param] = $value;
	}
	
	/**
	 * Returns the array of parameters the exception was created with.
	 * @method params
	 * @return {array}
	 */
	function params()
	{
		return $this->params;
	}
	
	/**
	 * Returns the array of names of input fields the exception applies to.
	 * @method inputFields
	 * @return {array}
	 */
	function inputFields()
	{
		return $this->inputFields;
	}
	
	/**
	 * Registers a new exception class that extends Q_Exception
	 * @method add
	 * @static
	 * @param {string} $className The name of the exception class.
	 * @param {string} $message The description of the error. Will be eval()-ed before rendering,
	 *  so it can include references to parameters, such as $my_param.
	 * @param {number|string} $header Any HTTP response code to set, such as 404,
	 *  or a string header to set with header()
	 * @param {array} [$rethrowDestClasses=array()] The name of the class that should handle this exception,
	 * @param {string} [$baseClassName=null] Here you can pass the name of different base class than Q_Exception
	 *  should it be thrown. Almost all catch() blocks in your code should use
	 *  `Q_Exception::rethrow($e, __CLASS__)` as the first statement, 
	 *  if the exception might have to be re-thrown further down the stack.
	 */
	static function add(
	 $className,
	 $message,
	 $header = null,
	 $rethrowDestClasses = array(),
	 $baseClassName = null)
	{
		if (is_string($rethrowDestClasses)) {
			$baseClassName = $rethrowDestClasses;
			$rethrowDestClasses = array();
		}
		if (isset($header)) {
			self::$headers[$className] = $header;
		}
		static $exception_code = 10000;
		++$exception_code; // TODO: improve this somehow
		self::$codes[$className] = $exception_code;
		self::$messages[$className] = $message;
		self::$rethrowDestClasses[$className] = $rethrowDestClasses;
		if (is_array($baseClassName)) {
			$rethrowDestClasses = $baseClassName;
			$baseClassName = null;
		}
		if (isset($baseClassName)) {
			self::$baseClasses[$className] = isset($baseClass) ? $baseClass : 'Q_Exception';
		}
	}
	
	/**
	 * Use in your catch() blocks if you think the exception 
	 * might have to be thrown further down the stack.
	 * @method rethrow
	 * @static
	 * @param {Exception} $exception The exception that was thrown. It is analyzed for
	 *  whether it should be re-thrown.
	 * @param {string} $currentClass If the $rethrowDestClasses was specified in Q_Exception::add
	 *  when creating this exception's class, and it does not contain
	 *  $currentClass, this function throws the exception again.
	 */
	static function rethrow(
	 $exception, 
	 $currentClass)
	{
		if (!is_callable(array($exception, 'rethrowDestClasses'))) {
			return false;
		}

		$rdc = $exception->rethrowDestClasses();
		if ($rdc and !in_array($currentClass, $rdc)) {
			throw $exception;
		}
	}
	
	/**
	 * Returns an array of classes to rethrow to, if any.
	 * @method rethrowDestClasses
	 * @return {array}
	 */
	function rethrowDestClasses()
	{
		$className = get_class($this);
		if (isset(self::$rethrowDestClasses[$className])) {
			return self::$rethrowDestClasses[$className];
		}
		return array();
	}
	
	/**
	 * Returns the trace array, can be overridden. Use this in your exception reporting.
	 * This is the default implementation.
	 * @method getTraceEx
	 * @return {array}
	 */
	function getTraceEx()
	{
		if (isset($this->trace)) {
			return $this->trace;
		}
		return parent::getTrace();
	}
	
	/**
	 * Returns trace as string, can be overridden. Use this in your exception reporting.
	 * This is the default implementation.
	 * @method getTraceAsStringEx
	 * @return {string}
	 */
	function getTraceAsStringEx()
	{
		if (isset($this->traceAsString)) {
			return $this->traceAsString;
		}
		return parent::getTraceAsString();
	}
	
	/**
	 * Converts an exception or array of exceptions to an array
	 * @method toArray
	 * @static
	 * @param {Exception|array} $exceptions The exception object or array of exceptions to convert
	 * @return {array}
	 */
	static function toArray($exceptions)
	{
		if (empty($exceptions)) {
			return array();
		}
		$array_was_passed = true;
		if (!is_array($exceptions)) {
			$exceptions = array($exceptions);
			$array_was_passed = false;
		}
		$results = array();
		$show_fal = Q_Config::get('Q', 'exception', 'showFileAndLine', true);
		$show_trace = Q_Config::get('Q', 'exception', 'showTrace', true);
		foreach ($exceptions as $e) {
			if (!($e instanceof Exception)) {
				continue;
			}
			$message = $e->getMessage();
			$code = $e->getCode();
			if ($show_fal) {
				$line = $e->getLine();
				$file = $e->getFile();
			}
			if ($show_trace) {
				if (is_callable(array($e, 'getTraceEx'))) {
					$trace = $e->getTraceEx();
				} else {
					$trace = $e->getTrace();
				}
			}
			$fields = null;
			if (is_callable(array($e, 'inputFields'))) {
				$fields = $e->inputFields();
			}
			$classname = get_class($e);
			$results[] = @compact('message', 'code', 'line', 'file', 'trace', 'fields', 'classname');
		}
		if ($array_was_passed) {
			return $results;
		} else {
			$ret = reset($results);
			return $ret ? $ret : array();
		}
	}
	
	/**
	 * Return colored text that you can output in logs or text mode
	 * @return {string}
	 */
	function colored()
	{
		return self::coloredString($this);
	}
	
	/**
	 * Return colored text that you can output in logs or text mode
	 * Pass an exception or 
	 * @param {string|Exception} $exception The exception or an exception message. If the later, you must pass three more arguments.
	 * @param {string} [$file]
	 * @param {string} [$line]
	 * @param {string} [$trace]
	 * @return {string}
	 */
	static function coloredString($message, $file=null, $line=null, $trace=null)
	{
		if ($message instanceof Exception) {
			$e = $message;
			$traceString = is_callable(array($e, 'getTraceAsStringEx'))
				? $e->getTraceAsStringEx()
				: $e->getTraceAsString();
			return self::coloredString(
				$e->getMessage(),
				$e->getFile(),
				$e->getLine(),
				$traceString
			);
		}
		$colors = Q_Config::get('Q', 'exception', 'colors', array());
		Q::autoload('Q_Utils');
		$fields = array(
			'message' => $message,
			'fileAndLine' => "in $file ($line)",
			'trace' => $trace
		);
		foreach ($fields as $f => $v) {
			$c0 = isset($colors[$f][0]) ? $colors[$f][0] : null;
			$c1 = isset($colors[$f][1]) ? $colors[$f][1] : null;
			$fields[$f] = Q_Utils::colored($v, $c0, $c1);
		}
		$reset = Q_Utils::colored("", "", "");
		return "$fields[message]\n\n$fields[fileAndLine]\n$fields[trace]\n";
	}
	
	/**
	 * @property $params
	 * @public
	 * @type array
	 */
	public $params = array();
	/**
	 * @property $inputFields
	 * @public
	 * @type array
	 */
	public $inputFields = array();

	/**
	 * @property $codes
	 * @protected
	 * @type array
	 */
	protected static $codes = array();
	/**
	 * @property $messages
	 * @protected
	 * @type array
	 */
	protected static $messages = array();
	/**
	 * @property $headers
	 * @protected
	 * @type array
	 */
	protected static $headers = array();
	/**
	 * @property $rethrowDestClasses
	 * @protected
	 * @type array
	 */
	protected static $rethrowDestClasses = array();
	/**
	 * @property $baseClasses
	 * @protected
	 * @type array
	 */
	protected static $baseClasses = array();
	/**
	 * @property $trace
	 * @protected
	 * @type array
	 */
	protected $trace = null;
	/**
	 * @property $traceAsString
	 * @protected
	 * @type string
	 */
	protected $traceAsString = null;
	/**
	 * @property $code
	 * @protected
	 * @type string
	 */
	protected $code = null;
	/**
	 * @property $header
	 * @public
	 * @type integer|string
	 */
	public $header = null;
}
