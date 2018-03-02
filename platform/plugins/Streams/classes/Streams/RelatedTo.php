<?php
/**
 * @module Streams
 */
/**
 * Class representing 'RelatedTo' rows in the 'Streams' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a related_to row in the Streams database.
 *
 * @class Streams_RelatedTo
 * @extends Base_Streams_RelatedTo
 */
class Streams_RelatedTo extends Base_Streams_RelatedTo
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
	 * @return Streams_RelatedTo
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
	 * Fetch all the relations given multiple category streams,
	 * and sort them by ascending weight.
	 * @method fetchAll
	 * @static
	 * @param {string} $publisherId The publisher of the category streams
	 * @param {array} $streamNames Array of criteria to put for stream names,
	 *  which can include strings, arrays, Db_Range or Db_Expression objects.
	 * @param {string|array} $relationType The type of the relation.
	 *  Can also be an array of criteria corresponding to the $streamNames array.
	 * @param {array} [$options=array()] Options to apss to the Streams::related function.
	 *  Can also include the following:
	 * @param {string} [$options.asUserId] Override the default user id to fetch streams as.
	 *  Not used for now, since this function always fetches the relations only.
	 * @return {array} An array of Streams_RelatedTo objects sorted by ascending weight.
	 */
	static function fetchAll($publisherId, $streamNames, $relationType, $options = array())
	{
		$result = array();
		foreach ($streamNames as $i => $streamName) {
			$type = is_string($relationType)
				? $relationType
				: $relationType[$i];
			$options['relationsOnly'] = true;
			$options['type'] = $type;
			$relations = Streams::related(
				Q::ifset($options, 'asUserId', null),
				$publisherId,
				$streamName,
				true,
				$options
			);
			$result = array_merge($result, $relations);
		}
		uasort($result, array('Streams_RelatedTo', '_compareByWeight'));
		return $result;
	}
	
	static function _compareByWeight($a, $b)
	{
		return ($a->weight !== $b->weight)
			? ($a->weight > $b->weight ? 1 : -1)
			: 0;
	}

	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Streams_RelatedTo} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Streams_RelatedTo();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};