<?php
/**
 * @module Users
 */
/**
 * Class representing 'Web3Transaction' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a web3_transaction row in the Users database.
 *
 * @class Users_Web3Transaction
 * @extends Base_Users_Web3Transaction
 */
class Users_Web3Transaction extends Base_Users_Web3Transaction
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
	 * Add any Users_Web3Transaction methods here, whether public or not
	 */
	 
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @static
	 * @param {array} $array
	 * @return {Users_Web3Transaction} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Users_Web3Transaction();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};