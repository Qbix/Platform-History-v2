<?php

/**
 * @module Q
 */
/**
 * This class lets you run test cases
 * @class Q_TestCase
 */
class Q_TestCase
{
	/**
	 * Runs the tests
	 * @method run
	 * @return {array} $results Returns array of results. A result consists of 
	 */
	function run()
	{
		$results = array();
		
		$this->saveState();
		
		$class = get_class($this);
		$class_methods = get_class_methods($class);
		shuffle($class_methods); // execute tests in random order!
		foreach ($class_methods as $cm) {
			if (substr($cm, -4) == 'Test') {
				// Run the test
				if (is_callable(array($this, 'setUp'))) {
					$this->setUp();
				}
					//echo "running $class::$cm...\n";
				try {
					$ret = call_user_func(array($this, $cm));
					// $ret is not used for now.
					$results[$class][$cm] = array(self::TEST_SUCCEEDED, 'succeeded');
				} catch (Q_Exception_TestCase $e) {
					// one of the predefined testcase outcomes occurred
					$results[$class][$cm] = array($e->getCode(), $e->getMessage());
				} catch (Exception $e) {
					$results[$class][$cm] = array(self::TEST_EXCEPTION, 'exception', $e);
				}
				if (is_callable(array($this, 'tearDown'))) {
					$this->tearDown();
				}
				$this->restoreState();
			}
		}
		$this->hasToRun = false;
		
		return $results;
	}
	
	/**
	 * get a fixture variable
	 * @method get
	 * @param {string} $name
	 * @param {mixed} [$default=null]
	 * @return {mixed}
	 */
	function get ($name, $default = null)
	{
		if (! isset($this->p))
			$this->p = new Q_Tree();
		return $this->p->get($name, $default);
	}

	/**
	 * set up a fixture variable
	 * @method set
	 * @param {string} $name
	 * @param {mixed} [$value=null]
	 * @return {mixed}
	 */
	function set ($name, $value = null)
	{
		if (! isset($this->p))
			$this->p = new Q_Tree();
		return $this->p->set($name, $value);
	}

	/**
	 * Clears a fixture variable
	 * @method clear
	 * @param string $name The name of the variable
	 */
	function clear ($name)
	{
		if (! isset($this->p))
			$this->p = new Q_Tree();
		return $this->p->clear($name);
	}

	/**
	 * Gets all the fixture variables.
	 * Typically, you would do extract($this->getAll())
	 * at the beginning of a test.
	 * @method getAll
	 * @return {array}
	 */
	function getAll ()
	{
		if (! isset($this->p))
			$this->p = new Q_Tree();
		return $this->p->getAll();
	}
	
	/**
	 * Call to indicate the test failed
	 * @method testFailed
	 * @param string [$message="failed"] Optional custom message.
	 * @throws {Q_Exception_TestCaseFailed}
	 */
	function testFailed($message = "failed")
	{
		$result = self::TEST_FAILED;
		throw new Q_Exception_TestCaseFailed(@compact('message', 'result'));
	}
	
	/**
	 * Call to indicate the test was skipped
	 * @method testSkipped
	 * @param string [$message="skipped"] Optional custom message.
	 * @throws {Q_Exception_TestCaseSkipped}
	 */
	function testSkipped($message = "skipped")
	{
		$result = self::TEST_SKIPPED;
		throw new Q_Exception_TestCaseSkipped(@compact('message', 'result'));
	}
	
	/**
	 * Call to indicate the test is not yet completely written.
	 * @method testIncomplete
	 * @param string [$message="incomplete"] Optional custom message.
	 * @throws {Q_Exception_TestCaseIncomplete}
	 */
	function testIncomplete($message = "incomplete")
	{
		$result = self::TEST_INCOMPLETE;
		throw new Q_Exception_TestCaseIncomplete(@compact('message', 'result'));
	}
	
	/**
	 * Saves the initial state of the State
	 * @method saveState
	 */
	private function saveState()
	{
		if (!$this->saved_super_globals) {
			$this->saved_super_globals = array(
				'GLOBALS' => $GLOBALS, 
				'_ENV' => $_ENV, 
				'_POST' => $_POST, 
				'_GET' => $_GET, 
				'_COOKIE' => $_COOKIE, 
				'_SERVER' => $_SERVER, 
				'_FILES' => $_FILES, 
				'_REQUEST' => $_REQUEST
			);
		}
		
		if (!$this->saved_p) {
			$this->saved_p = $this->p;
		}
	}
	
	/**
	 * Restores the initial state of the State
	 * @method restoreState
	 */
	private function restoreState()
	{
		$this->p = $this->saved_p;
		
		if (!empty($this->saved_super_globals)) {
			$GLOBALS = $this->saved_super_globals['GLOBALS'];
			$_ENV = $this->saved_super_globals['_ENV'];
			$_POST = $this->saved_super_globals['_POST'];
			$_GET = $this->saved_super_globals['_GET'];
			$_COOKIE = $this->saved_super_globals['_COOKIE'];
			$_SERVER = $this->saved_super_globals['_SERVER'];
			$_FILES = $this->saved_super_globals['_FILES'];
			$_REQUEST = $this->saved_super_globals['_REQUEST'];
		}

		return true;
	}
	
	/**
	 * @property $p
	 * @type Q_Tree
	 */
	public $p = null;
	/**
	 * @property $saved_p
	 * @type Q_Tree
	 */
	public $saved_p = null;
	
	/**
	 * @property $saved_super_globals
	 * @type array
	 * @private
	 */
	private $saved_super_globals = false;

	/*
	 * Constants for QTestCase results
	 */
	// green:
	/**
	 * @config TEST_SUCCEEDED
	 */
	const TEST_SUCCEEDED = 1;
	// yellow:
	/**
	 * @config TEST_INCOMPLETE
	 */
	const TEST_INCOMPLETE = 12;
	/**
	 * @config TEST_SKIPPED
	 */
	const TEST_SKIPPED = 13;
	// red:
	/**
	 * @config TEST_FAILED
	 */
	const TEST_FAILED = 20;
	/**
	 * @config TEST_EXCEPTION
	 */
	const TEST_EXCEPTION = 21;

}

/// { aggregate classes for production
/// Exception/TestCaseFailed.php
/// Exception/TestCaseIncomplete.php
/// Exception/TestCaseSkipped.php
/// }
