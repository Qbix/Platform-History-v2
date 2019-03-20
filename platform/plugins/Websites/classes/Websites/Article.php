<?php
/**
 * @module Websites
 */
/**
 * Class representing 'Article' rows in the 'Websites' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a article row in the Websites database.
 *
 * @class Websites_Article
 * @extends Base_Websites_Article
 */
class Websites_Article extends Base_Websites_Article
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
	 * @param {array} $array
	 * @return {Websites_Article} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Websites_Article();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};