<?php
/**
 * @module Streams
 */
/**
 * Class representing 'Task' rows in the 'Streams' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a task row in the Streams database.
 *
 * @class Streams_Task
 * @extends Base_Streams_Task
 */
class Streams_Task extends Base_Streams_Task
{
	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	function setUp()
	{
		parent::setUp();
		// INSERT YOUR CODE HERE
		// e.g. $this->hasMany(...) and stuff like that.
	}
	 
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @static
	 * @param {array} $array
	 * @return {Streams_Task} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Streams_Task();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};