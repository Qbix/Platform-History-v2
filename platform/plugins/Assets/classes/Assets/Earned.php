<?php
/**
 * @module Assets
 */
/**
 * Class representing 'Earned' rows in the 'Assets' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a earned row in the Assets database.
 *
 * @class Assets_Earned
 * @extends Base_Assets_Earned
 */
class Assets_Earned extends Base_Assets_Earned
{
	/**
	 * Saves a row in the database indicating that the user earned a badge
	 * @method badge
	 * @static
	 * @param {string} $userId The user who earned the badge
	 * @param {string} $badgeName The name of the badge
	 * @param {array} [$options=array()]
	 * @param {integer} [$options.earnedTime=time()] Timestamp when it was earned
	 * @param {boolean} [$options.duplicate=true] Whether to save it if it was already earned
	 * @param {string} [$options.communityId=Users::communityId()]
	 * @param {string} [$options.appId=Q::app()]
	 * @param {string} [$options.publisherId=null] The associated stream, if any
	 * @param {string} [$options.streamName=null] The associated stream, if any
	 * @return {Awards_Earned}
	 */
	static function badge($userId, $badgeName, $options = array())
	{
		$earnedTime = Q::ifset($options, 'earnedTime', time());
		$duplicate = Q::ifset($options, 'duplicate', true);
		$communityId = Q::ifset($options, 'communityId', Users::communityId());
		$appId = Q::ifset($options, 'appId', Q::app());
		$publisherId = Q::ifset($options, 'publisherId', null);
		$streamName = Q::ifset($options, 'streamName', null);
		$options['userId'] = $userId;
		$options['badgeName'] = $badgeName;
		if (!$duplicate) {
			$bt = Assets_Badge::badgesAndTotals(null, null, $options);
			if ($existing = Q::ifset($bt, $userId, 'badges', array())) {
				return;
			}
		}
		if (!isset($earnedTime)) {
			$earnedTime = time();
		}
		$earnedBadge = (new Assets_Earned(@compact(
			'appId', 'communityId', 'userId', 'earnedTime',
			'badgeName', 'publisherId', 'streamName'
		)))->save();
	}
	
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
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Assets_Earned} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Assets_Earned();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};