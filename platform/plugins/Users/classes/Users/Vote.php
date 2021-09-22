<?php
/**
 * @module Users
 */
/**
 * Class representing 'Vote' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a vote row in the Users database.
 *
 * @class Users_Vote
 * @extends Base_Users_Vote
 */
class Users_Vote extends Base_Users_Vote
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
	 * Calculates total votes
	 * @method beforeSave
	 * @param {array} $modifiedFields
	 * @return {array}
	 */
	function beforeSave($modifiedFields)
	{
		$total = new Users_Total();
		$total->forType = $this->forType;
		$total->forId = $this->forId;
		if (!$total->retrieve(null, array("begin" => true))) {
			$total->weightTotal = 0;
			$total->voteCount = 0;
			$total->value = 0;
		}
		$total->set('transaction', true);
		
		$vote = new Users_Vote();
		$vote->userId = $modifiedFields['userId'];
		$vote->forType = $modifiedFields['forType'];
		$vote->forId = $modifiedFields['forId'];
		$weightTotal = $total->weightTotal;
		if ($vote->retrieve()) {
			if (!$total->voteCount) {
				// something is wrong
				$total->voteCount = 1;
			}
			$total->weightTotal += ($modifiedFields['weight'] - $vote->weight);
			if (!$total->weightTotal) {
				throw new Q_Exception_BadValue(array(
					'internal' => 'Users_Vote_Total table', 
					'problem' => 'weight is 0'
				));
			}
			$total->value = 
				($total->value * $weightTotal 
					- $vote->value * $vote->weight 
					+ $modifiedFields['value'] * $modifiedFields['weight'])
				/ ($total->weightTotal);
		} else {
			if (!isset($modifiedFields['weight'])) {
				$modifiedFields['weight'] = 1;
			}
			$total->weightTotal += $modifiedFields['weight'];
			$total->voteCount += 1;
			$total->value = ($total->value * $weightTotal + $modifiedFields['value'] * $modifiedFields['weight'])
				/ ($total->weightTotal);
		}
	
		$this->set('total', $total);
		return parent::beforeSave($modifiedFields);
	}
	
	/**
	 * Updates total votes in Total table
	 * @method afterSaveExecute
	 * @param {Db_Result} $result
	 * @param {Db_Query} $query
	 * @param {array} $modifiedFields
	 * @param {array} $where
	 * @return {Db_Result}
	 */
	function afterSaveExecute($result, $query, $modifiedFields, $where)
	{
		$total = $this->get('total', false);
		if (!$total) return;
		
		if ($total->get('transaction', false)) {
			$total->save(true, true); // this commits the transaction
		} else {
			$total->save(true); // this simply saves the total
		}
		return $result;
	}
	
	/**
	 * Calculates total votes
	 * @method beforeRemove
	 * @param {array} $pk
	 * @return {boolean}
	 */
	function beforeRemove($pk)
	{	
		$vote = new Users_Vote();
		$vote->userId = $this->userId;
		$vote->forType = $this->forType;
		$vote->forId = $this->forId;
		if ($vote->retrieve()) {
			$total = new Users_Total();
			$total->forType = $vote->forType;
			$total->forId = $vote->forId;
			if ($total->retrieve(null, array('begin' => true))) {
				$weightTotal = $total->weightTotal;
				$total->set('transaction', true);
				$total->weightTotal -= $vote->weight;
				if (!$total->weightTotal) {
					$total->value = 0;
				} else {
					$total->value = 
						($total->value * $weightTotal - $vote->value * $vote->weight)
						/ ($total->weightTotal);
				}
				$total->voteCount -= 1;
			} else {
				// something is wrong ... if there are votes, there should have been a total
				$total->weightTotal = 0;
				$total->voteCount = 0;
				$total->value = 0;
			}
			$this->set('total', $total);
		}
		return true;
	}
	
	/**
	 * Updates total votes in Total table
	 * @method afterRemoveExecute
	 * @param {Db_Result} $result
	 * @param {Db_Query} $query
	 * @return {Db_Result}
	 */
	function afterRemoveExecute($result, $query)
	{
		$total = $this->get('total', false);
		if (!$total) return $result;

		if ($total->get('transaction', false)) {
			$total->save(true, true); // this commits the transaction
		} else {
			$total->save(true); // this simply saves the total
		}
		return $result;
	}

	/**
	 * Save user activity as a vote
	 * @method saveActivity
	 * @param {String} $type forType column
	 * @param {String} $name
	 */
	static function saveActivity ($type, $name) {
		$user = Users::loggedInUser();
		if (!$user) {
			return;
		}
		$n = Q_Utils::normalize($name);

		$day = 60 * 60 * 24;
		$week = $day * 7;
		$month = date("t") * $day;
		foreach (compact("day", "week", "month") as $period => $duration) {
			switch ($period) {
				case "day":
					$timestamp = strtotime("today");
					break;
				case "week":
					$timestamp = mktime(0, 0, 0, date("n"), date("j") - date("N") + 1);
					break;
				case "month":
					$timestamp = mktime(0, 0, 0, date("m"), 1);
					break;
				default:
					return;
			}

			$forId = "Users/activity/$n/$duration/$timestamp";

			$usersVote = new Users_Vote();
			$usersVote->userId = $user->id;
			$usersVote->forType = $type;
			$usersVote->forId = $forId;
			if (!$usersVote->retrieve(null, false, array("ignoreCache" => true))) {
				$usersVote->value = 1;
				try {
					$usersVote->save();
				} catch (Exception $e) {}
			}
		}
	}

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Users_Vote} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Users_Vote();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};