<?php
/**
 * @module Streams
 */
/**
 * Class representing 'Avatar' rows in the 'Streams' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a avatar row in the Streams database.
 *
 * @class Streams_Avatar
 * @extends Base_Streams_Avatar
 */
class Streams_Avatar extends Base_Streams_Avatar
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
	 * Retrieve avatars for one or more publishers as displayed to a particular user.
	 * 
	 * @method fetch
	 * @static
	 * @param $toUserId {User_User|string} The id of the user to which this would be displayed
	 * @param $publisherIds {string|array} Array of various users whose avatars are being fetched
	 * @param $indexField {string} Optional name of the field by which to index the resulting array
	 * @return {Streams_Avatar|array}
	 */
	static function fetch($toUserId, $publisherId, $indexField = null) {
		if (!isset($toUserIs)) {
			$toUserId = Users::loggedInUser();
			if (!$toUserId) $toUserId = "";
		}
		if ($toUserId instanceof Users_User) {
			$toUserId = $toUserId->id;
		}
		if ($publisherId instanceof Users_User) {
			$publisherId = $publisherId->id;
		}
		$return_one = false;
		if (!is_array($publisherId)) {
			$publisherId = array($publisherId);
			$return_one = true;
		}
		$rows = Streams_Avatar::select('*')->where(array(
			'toUserId' => array($toUserId, ''),
			'publisherId' => $publisherId
		))->fetchDbRows(null, '', $indexField);
		$avatars = array();
		foreach ($rows as $r) {
			if (!isset($avatars[$r->publisherId])
			or $r->toUserId !== '') {
				$avatars[$r->publisherId] = $r;
			}
		}
		return $return_one
			? ($avatars ? reset($avatars) : null)
			: $avatars;
	}

	/**
	 * Retrieve avatars for one or more publishers as displayed to a particular user.
	 * 
	 * @method fetchByPrefix
	 * @static
	 * @param $toUserId {User_User|string} The id of the user to which this would be displayed
	 * @param $prefix {string} The prefix for the firstName
	 * @param {array} $options=array()
	 *	'limit' => number of records to fetch
	 *  'fields' => defaults to array('username', 'firstName', 'lastName') 
	 *  'public' => defaults to false. If true, also gets publicly accessible names.
	 * @return {array}
	 */
	static function fetchByPrefix($toUserId, $prefix, $options = array()) {
		if ($toUserId instanceof Users_User) {
			$toUserId = $toUserId->id;
		}
		$toUserId = empty($options['public'])
			? $toUserId
			: array($toUserId, '');
		$fields = isset($options['fields'])
			? $options['fields']
			: array('firstName', 'lastName', 'username');
		$limit = isset($options['limit'])
			? $options['limit']
			: Q_Config::get('Users', 'Avatar', 'fetchByPrefix', 'limit', 100);
		$max = $limit;
		$avatars = array();
		$prefixes = preg_split("/\s+/", $prefix);
		$prefix = reset($prefixes);
		$criteria = array();
		if (count($prefixes) < 2) {
			foreach ($fields as $field) {
				$criteria[] = array(
					$field => new Db_Range($prefix, true, false, true)
				);	
			}
		} else {
			$criteria = array(
				array(
					'firstName' => new Db_Range($prefixes[0], true, false, true),
					'lastName' => new Db_Range($prefixes[1], true, false, true)
				),
				array(
					'firstName' => new Db_Range($prefixes[0], true, false, true),
					'username' => new Db_Range($prefixes[1], true, false, true)
				),
				array(
					'username' => new Db_Range($prefixes[0], true, false, true),
					'lastName' => new Db_Range($prefixes[1], true, false, true)
				)
			);
		}
		$count = count($criteria);
		for ($i=0; $i<$count; ++$i) {
			// NOTE: sharding should be done on toUserId only, not publisherId
			$q = Streams_Avatar::select('*')
				->where(array(
					'toUserId' => $toUserId
				))->andWhere($criteria[$i])
				->orderBy('firstName');
			$rows = $q->limit($max)->fetchDbRows();
			foreach ($rows as $r) {
				if (!isset($avatars[$r->publisherId])
				or $r->toUserId !== '') {
					$avatars[$r->publisherId] = $r;
				}
			}
			$max = $limit - count($avatars);
			if ($max <= 0) {
				break;
			}
		}
		return $avatars;
	}
	
	/**
	 * Calculate diplay name from avatar
	 * @method displayName
	 * @param {array} $options=array()
	 *  Associative array of options, which can include:<br/>
	 *   @param {boolean} [$options.short] Show one part of the name only
	 *   @param {boolean} [$options.show] The parts of the name to show. Can have the letters "f", "l", "u" in any order.
	 *   @param {boolean} [$options.html] If true, encloses the first name, last name, username in span tags. If an array, then it will be used as the attributes of the html.
	 *   @param {boolean} [$options.escape] If true, does HTML escaping of the retrieved fields
	 * @param {string} [$fallback] What to return if there is no info to get displayName from.
	 * @return {string|null}
	 */
	function displayName($options = array(), $fallback = null)
	{
		$fn = $this->firstName;
		$ln = $this->lastName;
		$u = $this->username;
		if (!empty($options['escape']) or !empty($options['html'])) {
			$fn = Q_Html::text($fn);
			$ln = Q_Html::text($ln);	
			$u = Q_Html::text($u);
		}

		if (!empty($options['html'])) {
			$attributes = is_array($options['html'])
				? $options['html'] 
				: array();
			$class = isset($attributes['class'])
				? ' ' . $attributes['class']
				: '';
			$attributes['class'] = "Streams_firstName$class";
			$attr = Q_Html::attributes($attributes);
			$fn2 = "<span $attr>$fn</span>";
			$attributes['class'] = "Streams_lastName$class";
			$attr = Q_Html::attributes($attributes);
			$ln2 = "<span $attr>$ln</span>";
			$attributes['class'] = "Streams_username$class";
			$attr = Q_Html::attributes($attributes);
			$u2 = "<span $attr>$u</span>";
			$f2 = "<span $attr>$fallback</span>";
		} else {
			$fn2 = $fn;
			$ln2 = $ln;
			$u2 = $u;
			$f2 = $fallback;
		}

		if (!empty($options['short'])) {
			return $fn ? $fn2 : ($u ? $u2 : $f2);
		}

		// $u = $u ? "\"$username\"" : '';

		if (!empty($options['show'])) {
			$show = str_split($options['show']);
			$parts = array();
			foreach ($show as $s) {
				$parts[] = ($s == 'f' ? $fn2 : ($s == 'l' ? $ln2 : $u2));
			}
			return implode(' ', $parts);
		}

		if ($fn and $ln) {
			return "$fn2 $ln2";
		} else if ($fn and !$ln) {
			return $u ? "$fn2 $u2" : $fn2;
		} else if (!$fn and $ln) {
			return $u ? "$u2 $ln2" : $ln2;
		} else {
			return $u ? $u2 : $f2;
		}
	}

	protected static $cache;

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Streams_Avatar} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Streams_Avatar();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};