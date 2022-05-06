<?php
/**
 * @module Streams
 */
/**
 * Class representing 'Participant' rows in the 'Streams' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a participant row in the Streams database.
 *
 * @class Streams_Participant
 * @extends Base_Streams_Participant
 */
class Streams_Participant extends Base_Streams_Participant
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
	 * Get an array of users participating in the stream
	 * @method getUsers
	 * @param {string} $publisherId
	 * @param {string} $streamName
	 * @param {array} [$options=array()] Options to pass to the Db_Query->options method
	 * @return {array}
	 *	An array of user ids 
	 */
	static function getUserIds($publisherId, $streamName, $options = array()) {
		$q = Streams_Participant::select('userId')
			->where(array(
				'publisherId' => $publisherId,
				'streamName' => $streamName
			));
		if ($options) {
			$q->options($options);
		}
		return $q->fetchAll(PDO::FETCH_COLUMN, 0);
	}

	/**
	 * Filter to just the ids of users which are, or are not, participating in a stream
	 * @method filter
	 * @static
	 * @param {array} $userIds An array of user ids to filter
	 * @param {string} $publisherId The id of the publisher of the stream
	 * @param {string} $streamName The name of the stream
	 * @param {string|array|null} $state can be "invited", "participating", "left", or an array, or null.
	 *  If null, then it will return any
	 * @return {array}
	 */
	static function filter($userIds, $publisherId, $streamName, $state = null) {
		$criteria = array(
			'publisherId' => $publisherId,
			'streamName' => $streamName,
			'userId' => $userIds
		);
		if (isset($state)) {
			$criteria['state'] = $state;
		}
		return Streams_Participant::select('userId')
			->where($criteria)
			->fetchAll(PDO::FETCH_COLUMN, 0);
	}

	/**
	 * Convert participant object to array safe to show to a user
	 * @method exportArray()
	 * @param {array} $options=null
	 * @return {array}
	 */
	function exportArray($options = null) {
		return $this->toArray();
	}
	
	/**
	 * @method getAllExtras
	 * @return {array} The array of all extras set in the stream
	 */
	function getAllExtras()
	{
		return empty($this->extra) 
			? array()
			: json_decode($this->extra, true);
	}
	
	/**
	 * @method getExtra
	 * @param {string} $extraName The name of the extra to get
	 * @param {mixed} $default The value to return if the extra is missing
	 * @return {mixed} The value of the extra, or the default value, or null
	 */
	function getExtra($extraName, $default = null)
	{
		$attr = $this->getAllExtras();
		return isset($attr[$extraName]) ? $attr[$extraName] : $default;
	}
	
	/**
	 * @method setExtra
	 * @param {string} $extraName The name of the extra to set,
	 *  or an array of $extraName => $extraValue pairs
	 * @param {mixed} $value The value to set the extra to
	 * @return Streams_Participant
	 */
	function setExtra($extraName, $value = null)
	{
		$attr = $this->getAllExtras();
		if (is_array($extraName)) {
			foreach ($extraName as $k => $v) {
				$attr[$k] = $v;
			}
		} else {
			$attr[$extraName] = $value;
		}
		$this->extra = Q::json_encode($attr);

		return $this;
	}
	
	/**
	 * @method clearExtra
	 * @param {string} $extraName The name of the extra to remove
	 */
	function clearExtra($extraName)
	{
		$attr = $this->getAllExtras();
		unset($attr[$extraName]);
		$this->extra = Q::json_encode($attr);
	}
	
	/**
	 * @method clearAllExtras
	 */
	function clearAllExtras()
	{
		$this->extra = '{}';
	}
	
	/**
	 * @method beforeSave
	 * @param {array} $modifiedFields
	 *	The fields that were modified
	 * @return {array}
	 */
	function beforeSave($modifiedFields)
	{
		if (empty($this->extra)) {
			$this->extra = '{}';
		}
		foreach ($this->fields as $name => $value) {
			if (!empty($this->fieldsModified[$name])) {
				$modifiedFields[$name] = $value;
			}
		}
		return parent::beforeSave($modifiedFields);
	}
	
	/**
	 * @method afterSaveExecute
	 * @param {Db_Result} $result
	 * @param {Db_Query} $query
	 * @return {Db_Result}
	 */
	function afterSaveExecute($result, $query, $modifiedFields, $where)
	{
		if ($this->state !== 'participating') {
			return $result;
		}
		// Relate to participating streams
		$participatingNames = Streams_Stream::getConfigField(
			$this->streamType, array('participating'), array()
		);
		if ($participatingNames) {
			Streams_RelatedTo::update()->set(array(
				'extra' => $this->extra
			))->where(array(
				'toPublisherId' => $this->userId,
				'toStreamName' => $participatingNames,
				'fromPublisherId' => $this->publisherId,
				'fromStreamName' => $this->streamName
			))->execute();
		}
		return $result;
	}
	
	/**
	 * Get the names of the possible states
	 * @method states
	 * @static
	 * @return {array}
	 */
	static function states()
	{
		$column = Base_Streams_Participant::column_state();
		return Q::json_decode(str_replace("'", '"',  '['.$column[0][1].']'));
	}

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Streams_Participant} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Streams_Participant();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};