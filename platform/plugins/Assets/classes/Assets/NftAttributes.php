<?php
/**
 * @module Assets
 */
/**
 * Class representing 'NftAttributes' rows in the 'Assets' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a nft_attributes row in the Assets database.
 *
 * @class Assets_NftAttributes
 * @extends Base_Assets_NftAttributes
 */
class Assets_NftAttributes extends Base_Assets_NftAttributes
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
	 * Add any Assets_NftAttributes methods here, whether public or not
	 */
	 
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @static
	 * @param {array} $array
	 * @return {Assets_NftAttributes} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Assets_NftAttributes();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};