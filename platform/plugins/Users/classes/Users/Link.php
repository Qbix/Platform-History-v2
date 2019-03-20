<?php
/**
 * @module Users
 */
/**
 * Class representing 'Link' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a link row in the Users database.
 *
 * @class Users_Link
 * @extends Base_Users_Link
 */
class Users_Link extends Base_Users_Link
{
	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	function setUp()
	{
		parent::setUp();
	}
	/**
	 * Assigns 'secret' and 'token' if empty
	 * @method beforeSave
	 * @param {array} $modifiedFields
	 * @return {array}
	 */
	function beforeSave($value)
	{
		if (!$this->retrieved) {
			if (!isset($value['secret'])) {
				$value['secret'] = uniqid(mt_rand(), true);
			}
			if (!isset($value['token'])) {
				$value['token'] = self::db()->uniqueId(self::table(), 'token');
			}
		}
		return parent::beforeSave($value);
	}

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Users_Link} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Users_Link();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};