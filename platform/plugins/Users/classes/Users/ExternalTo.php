<?php
/**
 * @module Users
 */
/**
 * Class representing 'ExternalTo' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a external_to row in the Users database.
 *
 * @class Users_ExternalTo
 * @extends Base_Users_ExternalTo
 */
class Users_ExternalTo extends Base_Users_ExternalTo
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
	 * Assign 'xid' field if not set
	 * @method beforeSave
	 * @param {array} $modifiedFields
	 * @return {array}
	 */
	function beforeSave($updatedFields)
	{
		if (!$this->retrieved) {
			if (!isset($updatedFields['xid'])) {
				$this->xid = $updatedFields['xid'] = 
				self::db()->uniqueId(self::table(), 'xid', null);
			}
		}
		return parent::beforeSave($updatedFields);
	}

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Users_ExternalTo} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Users_ExternalTo();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};