<?php
/**
 * @module Streams
 */
/**
 * Class representing 'State' rows in the 'Streams' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a state row in the Streams database.
 *
 * @class Streams_State
 * @extends Base_Streams_State
 */
class Streams_State extends Base_Streams_State
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

	/*
	 * Add any Streams_State methods here, whether public or not
	 */
	 
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @static
	 * @param {array} $array
	 * @return {Streams_State} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Streams_State();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};