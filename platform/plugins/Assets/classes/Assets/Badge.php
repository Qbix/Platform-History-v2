<?php
/**
 * @module Assets
 */
/**
 * Class representing 'Badge' rows in the 'Assets' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a badge row in the Assets database.
 *
 * @class Assets_Badge
 * @extends Base_Assets_Badge
 */
class Assets_Badge extends Base_Assets_Badge
{
	/**
	 * Calculates the total number of points each user got from earned badges
	 * @method calculateLeaders
	 * @static
	 * @param {integer} $fromTime The earnedTime must be at least this. Can be null.
	 * @param {integer} $untilTime The earnedTime must be less than this. Can be null.
	 * @param {array} [$options=array()]
	 * @param {string} [$options.communityId=Users::communityId()]
	 * @param {string} [$options.appId=Q::app()]
	 * @param {string|array|Db_Expression} [options.$userIds=null] Optionally filter user ids
	 * @param {string|array|Db_Expression} [options.$badgeName=null] Optionally filter badge name
	 * @return {array} the array of ($userId => array('badges' => $badges, 'total' => $points))
	 */
	static function badgesAndTotals($fromTime, $untilTime, $options = array())
	{
		$communityId = Q::ifset($options, 'communityId', Users::communityId());
		$appId = Q::ifset($options, 'appId', Q::app());
		$communityId = Users::communityId();
		$fromTime = $fromTime ? new Db_Expression("FROM_UNIXTIME($fromTime)") : null;
		$untilTime = $untilTime ? new Db_Expression("FROM_UNIXTIME($untilTime)") : null;
		$earnedTime = new Db_Range($fromTime, true, false, $untilTime);
		$criteria = @compact('communityId', 'app', 'earnedTime');
		if (isset($options['userIds'])) {
			$criteria['userId'] = $options['userIds'];
		}
		if (isset($options['badgeName'])) {
			$criteria['badgeName'] = $options['badgeName'];
		}
		$earned = Assets_Earned::select()
			->where($criteria)
			->fetchDbRows();
		$name = array();
		foreach ($earned as $earned) {
			$name[] = $earned->badgeName;
		}
		$badges = Assets_Badge::select()
			->where(@compact('communityId', 'app', 'name'))
			->fetchDbRows('name');
		$result = array();
		foreach ($earned as $e) {
			if (!isset($badges[$e->badgeName])) {
				throw new Q_Exception_MissingRow(array(
					'table' => 'Assets_Badge',
					'criteria' => "name = '{$e->badgeName}'"
				));
			}
			$badge = $badges[$e->badgeName];
			$result[$e->userId]['badges'][] = $badge;			
			$result[$e->userId]['total'] = Q::ifset($result, $e->userId, 'total', 0)
				+ $badge->points;
		}
		return $result;
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
	 * @return {Assets_Badge} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Assets_Badge();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};