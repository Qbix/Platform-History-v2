<?php
/**
 * @module Streams
 */
/**
 * Class representing 'Rule' rows in the 'Streams' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a rule row in the Streams database.
 *
 * @class Streams_Rule
 * @extends Base_Streams_Rule
 */
class Streams_Rule extends Base_Streams_Rule
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
	 * Assigns ordinal and readyTime
	 * @method beforeSave
	 * @param {array} $value
	 *	The row beind saved
	 * @return {array}
	 */
	function beforeSave($value)
	{
		if (!$this->retrieved) {
			$max = Streams_Rule::select("MAX(ordinal) + 1")->where(array(
				'ofUserId'    => $this->ofUserId,
				'publisherId' => $this->publisherId,
				'streamName'  => $this->streamName
			))->ignoreCache()->fetchAll(PDO::FETCH_COLUMN);

			$value['ordinal'] = $this->ordinal = isset($max[0]) ? $max[0] : 1; 
			if (!isset($this->readyTime)) {
				$value['readyTime'] = $this->readyTime = new Db_Expression('CURRENT_TIMESTAMP');
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
	 * @return {Streams_Rule} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Streams_Rule();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};