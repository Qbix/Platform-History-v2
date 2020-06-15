<?php
/**
 * @module Assets
 */
/**
 * Class representing 'Charge' rows in the 'Assets' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a charge row in the Assets database.
 *
 * @class Assets_Charge
 * @extends Base_Assets_Charge
 */
class Assets_Charge extends Base_Assets_Charge
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
	 * Assigns 'id'
	 * @method beforeSave
	 * @param {array} $modifiedFields
	 * @return {array}
	 */
	function beforeSave($updatedFields)
	{
		if (isset($updatedFields['userId'])) {
			$this->userId = $updatedFields['userId'];
		}
		if (!$this->retrieved) {
			if (!isset($updatedFields['id'])) {
				$this->id = $updatedFields['id'] = 
					self::db()->uniqueId(self::table(), 'id', array(
						'userId' => $this->userId
					));
			}
		}
		Q::event(
			'Assets/Charge/save', 
			array('charge' => $this),
			'before'
		);
		return parent::beforeSave($updatedFields);
	}
	/**
	 * Get all attributes as array
	 * @method getAllAttributes
	 * @return {array}
	 */
	function getAllAttributes()
	{
		return empty($this->attributes)
			? array()
			: json_decode($this->attributes, true);
	}
	/**
	 * @method getAttribute
	 * @param {string} $attributeName The name of the attribute to get
	 * @param {mixed} $default The value to return if the attribute is missing
	 * @return {mixed} The value of the attribute, or the default value, or null
	 */
	function getAttribute($attributeName, $default = null)
	{
		$attr = $this->getAllAttributes();
		return Q::ifset($attr, $attributeName, $default);
	}
	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @static
	 * @param {array} $array
	 * @return {Assets_Charge} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Assets_Charge();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};