<?php
/**
 * @module Users
 */
/**
 * Class representing 'Quota' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a quota row in the Users database.
 *
 * @class Users_Quota
 * @extends Base_Users_Quota
 */
class Users_Quota extends Base_Users_Quota
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
	 * Check whether the given user can use some more units of the quota.
	 * For APIs, you might call this once for an app user, and once for a person user.
	 * @param {string} $userId the user that will be using the quota
	 * @param {string} $resourceId pass an empty string for global resource check, or for example a string beginning with Users::communityId()
	 * @param {string} $name the name of the quota to check
	 * @param {boolean} [$throwIfQuota=false] pass true to throw an exception if one or more of the quotas have been exceeded
	 * @param {integer} [$units=1] how many units of the quota you expect the user will use
	 * @param {array} [$privileges=array()] any strings naming privileges the user has with respect to the resourceId that might increase the max of the quota
	 * @param {boolean} [$begin=true] whether to begin a database transaction, in which case you must call $quota->used($used) to commit the transaction.
	 * @return {Users_Quota|array} if no quotas were exceeded, this object is returned and you can call ->used($units) on it later. But if some quotas were exceeded, the function returns the array of corresponding durations, sorted by smallest first.
	 */
	static function check(
		$userId, 
		$resourceId, 
		$name, 
		$throwIfQuota = false, 
		$units = 1, 
		$privileges = array(),
		$begin = true)
	{
		$quota = new Users_Quota(compact('userId', 'resourceId', 'name'));
		$durations = array();
		$quotas = Q_Config::get('Users', 'quotas', array());
		if (!isset($quotas[$name])) {
			$quota->set('begun', false);
			return $quota;
		}
		$q = $quotas[$name];
		if (!is_array($q)) {
			throw new Q_Exception_BadValue(array(
				'internal' => "Users/quotas/$name",
				'problem' => "must be an array"
			));
		}
		$title = isset($q['title']) ? $q['title'] : $name;
		foreach ($q as $duration => $info) {
			if (!is_numeric($duration)) {
				continue;
			}
			if (!in_array($duration, $durations)) {
				$durations[] = (int)$duration;
			}
		}
		if (empty($durations)) {
			return true;
		}
		$condition = '';
		rsort($durations);
		$condition = $largest = reset($durations);
		$time = Users_Quota::db()->getCurrentTimestamp();
		for ($i=1, $c=count($durations); $i < $c; ++$i) {
			$duration = $durations[$i];
			$startTime = $time - $duration;
			$condition = "IF (insertedTime >= FROM_UNIXTIME($startTime), $duration, $condition)";
		}
		$startTime = $time - $largest;
		$expr = new Db_Expression("FROM_UNIXTIME($startTime)");
		$query = Users_Quota::select("$condition c, SUM(units) si")->where(array(
			'userId' => $userId,
			'resourceId' => $resourceId,
			'insertedTime' => new Db_Range($expr, true, false, null)
		))->groupBy('c');
		$queries = $query->shard();
		if ($begin) {
			$query = $query->begin();
		}
		$shards = array_keys($queries);
		$quota->set(array(
			'begun' => $begin,
			'shards' => $shards
		));
		$results = $query->fetchAll(PDO::FETCH_ASSOC);
		if (!isset($privileges)) {
			$privileges = array();
		}
		$exceeded = array();
		sort($durations);
		foreach ($durations as $d) {
			if (is_array($q[$d])) {
				if (!isset($q[$d][''])) {
					throw new Q_Exception_MissingConfig(array(
						'fieldpath' => "Users/quotas/$name/$d/" . '""'
					));
				}
				$max = $q[$d][''];
				foreach ($q[$d] as $k => $v) {
					if (!is_numeric($v)) {
						throw new Q_Exception_BadValue(array(
							'internal' => "Users/quotas/$name/$d/$k",
							'problem' => "must be an integer"
						));
					}
					if (in_array($k, $privileges)) {
						$max = max($max, $v);
					}
				}
			} else {
				$max = $q[$d];
				if (!is_numeric($max)) {
					throw new Q_Exception_BadValue(array(
						'internal' => "Users/quotas/$name/$d",
						'problem' => "must be an integer"
					));
				}
			}
			$si = 0;
			foreach ($results as $r) {
				if ($r['c'] <= $duration) {
					$si += $r['si'];
				}
			}
			if ($si + $units > $max) {
				$exceeded[] = $d;
			}
		}
		if ($exceeded) {
			Users_Quota::rollback()->execute(false, $shards);
			if ($throwIfQuota) {
				throw new Users_Exception_Quota(compact('title'));
			}
			return $exceeded;
		}
		return $quota;
	}
	
	/**
	 * Insert a record of the user using some units of the quota
	 * For APIs, you might call this once for an app user, and once for a person user.
	 * You must call this to commit the transaction.
	 * @param {string} $userId the user that will be using the quota
	 * @param {string} $resourceId pass an empty string for global resource check, or for example a string beginning with Users::communityId()
	 * @param {string|array} $name the name of the quota, or you can pass the names of several quotas to record at once
	 * @param {integer} [$units=1] how many units of the quota the user has used
	 * @return {boolean} whether the quota record was inserted successfully
	 */
	function used($units = 1)
	{
		$this->units = $units;
		$this->save();
		if ($this->get('begun')) {
			$shards = array_keys($this->get('shards'));
			Users_Quota::commit()->execute(false, $shards);
		}
	}

	/*
	 * Add any Users_Quota methods here, whether public or not
	 */
	 
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @static
	 * @param {array} $array
	 * @return {Users_Quota} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Users_Quota();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};