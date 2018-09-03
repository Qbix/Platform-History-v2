<?php
/**
 * @module Streams
 */
/**
 * Class representing 'SubscriptionRule' rows in the 'Streams' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a subscription_rule row in the Streams database.
 *
 * @class Streams_SubscriptionRule
 * @extends Base_Streams_SubscriptionRule
 */
class Streams_SubscriptionRule extends Base_Streams_SubscriptionRule
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
	 * Add any Streams_SubscriptionRule methods here, whether public or not
	 */
	 
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @static
	 * @param {array} $array
	 * @return {Streams_SubscriptionRule} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Streams_SubscriptionRule();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};