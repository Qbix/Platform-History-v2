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
		return $result;
	}

	/**
	 * Call this function to relate a stream with the weight being
	 * inserted randomly among other weights. To not disturb already-consumed
	 * relations, indicate the name of the attribute holding the weight of the
	 * latest-consumed relations.
	 * @method insertRandomly
	 * @static
	 * @param {Streams_Stream} $category
	 * @param {string} $relationType
	 * @param {Streams_Stream} $stream
	 * @param {string} [$consumedAttribute] name of attribute holding the highest weight of already-consumed related streams, if any
	 * @param {string} [$totalAttribute] name of attribute holding total number of related streams. By default, uses the Streams_RelatedToTotal for that stream type
	 * @return {integer} Returns the weight of the relation to the category where the stream was inserted
	 */
	static function insertRandomly(
		$category,
		$relationType,
		$stream,
		$consumedAttribute = null,
		$totalAttribute = null
	) {
		// let's find a random NFT that wasn't minted yet
		$consumedWeight = $consumedAttribute
			? $category->getAttribute($consumedAttribute, 0)
			: 0;
		if ($totalAttribute) {
			$total = $category->getAttribute($totalAttribute, 0);
		} else {
			$rtt = new Streams_RelatedToTotal(array(
				'toPublisherId' => $category->publisherId,
				'toStreamName' => $category->name,
				'relationType' => $relationType,
				'fromStreamType' => $stream->type
			));
			$total = $rtt->retrieve()
				? $rtt->relationCount
				: 0;
		}
		$weight = $total + 1;
		$relations = $category->related($category->publisherId, true, array(
			'type' => $relationType,
			'orderBy' => 'random',
			'limit' => 1,
			'where' => array(
				'weight >' => $consumedWeight
			),
			'relationsOnly' => true
		));
		$r = reset($relations);
		if ($r and $r->fromStreamName) {
			// swap weights with a previous relation
			Streams::updateRelation(
				$category->publisherId,
				$category->publisherId,
				$category->name,
				$relationType,
				$r->fromPublisherId,
				$r->fromStreamName,
				$weight,
				0
			);
			$stream->relateTo(
				$category, 
				$relationType, 
				$category->publisherId,
				array(
					'weight' => $r->weight
				)
			);
		} else {
			// just insert a new relation
			$stream->relateTo(
				$category, 
				$relationType, 
				$category->publisherId,
				array(
					'weight' => $weight
				)
			);
		}
		$category->setAttribute($totalAttribute, $weight);
		$category->save(); // we added another randomized relation
		return $weight;
	}

	/**
	 * Call this function to unrelate a stream whose weight was inserted
	 * randomly among other weights, and swap in the relation with the highets
	 * weight.
	 * @method removeInsertedRandomly
	 * @static
	 * @param {Streams_Stream} $category
	 * @param {string} $relationType
	 * @param {Streams_Stream} $stream
	 * @param {string} [$consumedAttribute] name of attribute holding the highest weight of already-consumed related streams, if any
	 * @param {string} [$totalAttribute] name of attribute holding total number of related streams. By default, uses the Streams_RelatedToTotal for that stream type
	 * @return {boolean} whether it was removed
	 */
	static function removeInsertedRandomly(
		$category,
		$relationType,
		$stream,
		$consumedAttribute = null,
		$totalAttribute = null
	) {
		$rt = (new Streams_RelatedTo(array(
			'toPublisherId' => $category->publisherId,
			'toStreamName' => $category->name,
			'type' => $relationType,
			'fromPublisherId' => $stream->publisherId,
			'fromStreamName' => $stream->name
		)))->retrieve();
		if (!$rt) {
			return false; // nothing to remove
		}
		// remove current relation
		$stream->unrelateTo($category, $relationType, $category->publisherId);
		if ($totalAttribute) {
			$total = $category->getAttribute($totalAttribute, 0);
		} else {
			$rtt = new Streams_RelatedToTotal(array(
				'toPublisherId' => $category->publisherId,
				'toStreamName' => $category->name,
				'relationType' => $relationType,
				'fromStreamType' => $stream->type
			));
			$total = $rtt->retrieve()
				? $rtt->relationCount
				: 0;
		}
		$relatedStreams = $category->related(
			$category->publisherId, true,
			array(
				$relationType,
				'limit' => 1,
				'where' => array(
					'weight' => $total
				),
				'streamsOnly' => true
			)
		);
		$rs = reset($relatedStreams);
		if ($rs) {
			// fill weight hole with relation that has largest weight
			Streams::updateRelation(
				$category->publisherId,
				$category->publisherId,
				$category->name,
				$relationType,
				$rs->publisherId,
				$rs->name,
				$rt->weight,
				0
			);
		}
		$consumedWeight = $consumedAttribute
			? $category->getAttribute($consumedAttribute, 0)
			: 0;
		if ($consumedAttribute and $rt->weight <= $consumedWeight) {
			// it was already consumed
			$category->setAttribute($consumedAttribute, $consumedWeight - 1);
		}
		$category->setAttribute($totalAttribute, $total - 1);
		$category->save(); // we added another randomized relation
		return $rt;
	}

	/**
	 * Call this method to indicate the next relation "consumed"
	 * and advance the pointer by one.
	 * @method consume
	 * @static
	 * @param {Streams_Stream} $category
	 * @param {string} $relationType
	 * @param {string} $consumedAttribute name of attribute holding the highest weight of already-consumed related streams, if any
	 * @param {string} [$totalAttribute] name of attribute holding total number of related streams. By default, uses the Streams_RelatedToTotal for that stream type
	 * @return {Streams_Stream|null} The related stream, or null
	 * @throw {Q_Exception_MissingObject} 
	 */
	static function consume(
		$category,
		$relationType,
		$consumedAttribute,
		$totalAttribute = null)
	{
		$consumedWeight = $category->getAttribute($consumedAttribute, 0);
		if ($totalAttribute) {
			$total = $category->getAttribute($totalAttribute, 0);
			if ($consumedWeight + 1 > $total) {
				return false; // there are no more to consume
			}
		}
		list($relations, $streams, $stream) = Streams::related(
			Q::ifset($options, 'asUserId', null),
			$category->publisherId,
			$category->name,
			true,
			array(
				'weight' => new Db_Range($consumedWeight, false, true, null),
				'orderBy' => false,
				'limit' => 1,
				'streamsOnly' => true,
				'type' => $relationType
			)
		);
		$stream = reset($streams);
		if (!$stream) {
			return null;
		}
		$relation = reset($relations);
		$category->setAttribute($consumedAttribute, $relation->weight);
		$category->save();
		return reset($streams);
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