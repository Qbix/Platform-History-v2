<?php
/**
 * @module Streams
 */
/**
 * Class representing 'State' rows in the 'Streams' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a state row in the Streams database.
 *
 * @class Streams_State
 * @extends Base_Streams_State
 */
class Streams_State extends Base_Streams_State
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
	 * 
	 */
	static function fileHash($filename, $algorithm = 'sha256')
	{
		$contents = file_get_contents($filename);
		return hash($algorithm, $contents);
	}

	static function fileHMAC($filename, $key, $algorithm = 'sha256')
	{
		$contents = file_get_contents($filename);
		return hash_hmac($algorithm, $contents, $key);
	}

	/**
	 * @method fetch
	 * @static
	 * @param {string} $hash
	 * @param {string} [$algorithm='sha256'] See Streams_State->algorithm enum
	 * @return {array} An array of Streams_State rows containing what was found
	 */
	static function fetch($hash, $algorithm = 'sha256')
	{
		return Streams_State::select()->where(compact(
			'hash', 'algorithm'
		))->fetchDbRows();
	}

	/**
	 * @method store
	 * @static
	 * @param {string} $hash
	 * @param {string} $URI
	 * @param {string|array} $extra
	 * @param {string} [$storeDuplicates=false] If true, stores duplicates
	 * @param {string} [$algorithm='sha256'] See Streams_State->algorithm enum
	 * @return {Streams_State} Returns the row that's in the database. Check $row->get('Streams/wasStored') to know if it was stored
	 */
	static function store(
		$hash, 
		$URI, 
		$extra = '', 
		$storeDuplicates = false, 
		$algorithm = 'sha256'
	) {
		if (is_array($extra)) {
			$extra = Q::json_encode($extra);
		} else if (empty($extra)) {
			$extra = '{}';
		}
		
		$row = new Streams_State(compact('hash', 'algorithm', 'URI', 'extra'));
		if ($storeDuplicates) {
			$row->save();
			$row->set('Streams/wasStored', true);
		} else {
			$wasStored = $row->retrieveOrSave($retrieved, array('hash', 'algorithm'));
			$row->set('Streams/wasStored', $wasStored);
			if ($retrieved) {
				$retrieved->set('Streams/wasStored', false);
				return $retrieved;
			}
		}
		return $row;
	}

	/*
	 * Add any Streams_State methods here, whether public or not
	 */
	 
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @static
	 * @param {array} $array
	 * @return {Streams_State} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Streams_State();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};