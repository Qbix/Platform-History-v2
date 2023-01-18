<?php

/**
 * @module Db
 */

interface Db_Query_Interface
{
	/**
	 * Interface that an adapter must support
	 * to implement the Db class.
	 * @class Db_Query_Interface
	 * @constructor
	 * @param {Db_Interface} $db The database connection
	 * @param {integer} $type The type of the query. See class constants beginning with TYPE_ .
	 * @param {array} $clauses The clauses to add to the query right away
	 * @param {array} $parameters The parameters to add to the query right away (to be bound when executing)
	 */
	//function __construct (
	//	Db_Interface $db, 
	//	$type, 
	//	array $clauses = array(), 
	//	array $parameters = array())

	/**
	 * Builds the query from the clauses
	 * @method build
	 */
	function build ();
	
	/**
	 * Just builds the query and returns the string that would
	 * be sent to $pdo->prepare().
	 * If this results in an exception, the string will contain
	 * the exception instead.
	 * @method __toString
	 */
	function __toString ();

	/**
	 * Gets the SQL that would be executed with the execute() method.
	 * @method getSQL
	 * @param {callable} [$callback=null] If not set, this function returns the generated SQL string.
	 *  If it is set, this function calls $callback, passing it the SQL
	 *  string, and then returns $this, for chainable interface.
	 * @return {string|Db_Query} Depends on whether $callback is set or not.
	 */
	function getSQL ($callback = null);

	/**
	 * Gets a clause from the query
	 * @method getClause
	 * @param {string} $clauseName
	 * @param {boolean} [$withAfter=false]
	 * @return {mixed} If $withAfter is true, returns array($clause, $after) otherwise just returns $clause
	 */
	function getClause($clauseName, $withAfter = false);

	/**
	 * Merges additional replacements over the default replacement array,
	 * which is currently just
	 * @example
	 *       array ( 
	 *          '{{prefix}}' => $conn['prefix'] 
	 *       )
	 *
	 *  The replacements array is used to replace strings in the SQL
	 *  before using it. Watch out, because it may replace more than you want!
	 * @method replace
	 * @param {array} [$replacements=array()] This must be an array.
	 */
	function replace(array $replacements = array());

	/**
	 * You can bind more parameters to the query manually using this method.
	 * These parameters are bound in the order they are passed to the query.
	 * Here is an example:
	 * @example
	 * 	$result = $db->select('*', 'foo')
	 * 		->where(array('a' => $a))
	 * 		->andWhere('a = :moo')
	 * 		->bind(array('moo' => $moo))
	 * 		->execute();
	 *
	 * @method bind
	 * @param {array} [$parameters=array()] An associative array of parameters. The query should contain :name,
	 *  where :name is a placeholder for the parameter under the key "name".
	 *  The parameters will be properly escaped.
	 *  You can also have the query contain question marks (the binding is
	 *  done using PDO), but then the order of the parameters matters.
	 * @chainable
	 */
	function bind(array $parameters = array());
	
	/**
	 * Executes a query against the database and returns the result set.
	 * @method excecute
	 * @param {boolean} [$prepare_statement=false] Defaults to false. If true, a PDO statement will be prepared
	 *  from the query before it is executed. It is also saved for
	 *  future invocations to use.
	 *  Do this only if the statement will be executed many times with
	 *  different parameters. Basically you would use "->bind(...)" between 
	 *  invocations of "->execute()".
	 * @param {array|string} [$shards] You can pass a shard name here, or an array
	 *  where the keys are shard names and the values are the query to execute.
	 *  This will bypass the usual sharding algorithm.
	 * @return {Db_Result}
	 *  The Db_Result object containing the PDO statement that resulted
	 *  from the query.
	 */
	function execute ($prepare_statement = false, $shards = null);
	
	/**
	 * Begins a transaction right before executing this query.
	 * The reason this method is part of the query class is because
	 * you often need the "where" clauses to figure out which database to send it to,
	 * if sharding is being used.
	 * @method begin
	 * @param {string} [$$lockType='FOR UPDATE'] Defaults to 'FOR UPDATE', but can also be 'LOCK IN SHARE MODE'
	 * or set it to null to avoid adding a "LOCK" clause
	 * @param {string} [$transactionKey=null] Passing a key here makes the system throw an
	 *  exception if the script exits without a corresponding commit by a query with the
	 *  same transactionKey or with "*" as the transactionKey to "resolve" this transaction.
	 * @chainable
	 */
	function begin($lockType = null, $transactionKey = null);
	
	/**
	 * Rolls back a transaction right before executing this query.
	 * The reason this method is part of the query class is because
	 * you often need the "where" clauses to figure out which database to send it to,
	 * if sharding is being used.
	 * @method rollback
	 * @chainable
	 */
	function rollback();
	
	/**
	 * Commits a transaction right after executing this query.
	 * The reason this method is part of the query class is because
	 * you often need the "where" clauses to figure out which database to send it to,
	 * if sharding is being used.
	 * @method commit
	 * @param {string} [$transactionKey=null] Pass a transactionKey here to "resolve" a previously
	 *  executed that began a transaction with ->begin(). This is to guard against forgetting
	 *  to "resolve" a begin() query with a corresponding commit() or rollback() query
	 *  from code that knows about this transactionKey. Passing a transactionKey that doesn't
	 *  match the latest one on the transaction "stack" also generates an error.
	 *  Passing "*" here matches any transaction key that may have been on the top of the stack.
	 * @chainable
	 */
	function commit($transactionKey = null);
	
	/**
	 * Creates a query to select fields from one or more tables.
	 * @method select
	 * @param {string|array} $fields The fields as strings, or array of alias=>field
	 * @param {string|array} [$tables=''] The tables as strings, or array of alias=>table
	 * @param {boolean} [$reuse=true] If $tables is an array, and select() has
	 *  already been called with the exact table name and alias
	 *  as one of the tables in that array, then
	 *  this table is not appended to the tables list if
	 *  $reuse is true. Otherwise it is. $reuse is true by default.
	 *  This is really just for using in your hooks.
	 * @chainable
	 */
	function select ($fields, $tables = '', $reuse = true);

	/**
	 * Joins another table to use in the query
	 * @method join
	 * @param {string} $table The name of the table. May also be "name AS alias".
	 * @param {Db_Expression|array|string} $condition The condition to join on. Thus, JOIN table ON ($condition)
	 * @param {string} [$join_type='INNER'] The string to prepend to JOIN, such as 'INNER', 'LEFT OUTER', etc.
	 * @chainable
	 */
	function join ($table, $condition, $join_type = 'INNER');

	/**
	 * Adds a WHERE clause to a query
	 * @method where
	 * @param {Db_Expression|array} $criteria An associative array of expression => value pairs. 
	 *  The values are automatically escaped using PDO placeholders.
	 *  Or, this could be a Db_Expression object.
	 * @chainable
	 */
	function where ($criteria);

	/**
	 * Adds to the WHERE clause, like this:   "... AND (x OR y OR z)",
	 * where x, y and z are the arguments to this function.
	 * @method andWhere
	 * @param {Db_Expression|string} $criteria
	 * @param {Db_Expression|string} [$or_criteria=null]
	 * @chainable
	 */
	function andWhere ($criteria, $or_criteria = null);

	/**
	 * Adds to the WHERE clause, like this:   "... OR (x AND y AND z)",
	 * where x, y and z are the arguments to this function.
	 * @method orWhere
	 * @param {Db_Expression|string} $criteria
	 * @param {Db_Expression|string} [$and_criteria=null]
	 * @chainable
	 */
	function orWhere ($criteria, $and_criteria = null);

	/**
	 * Adds a GROUP BY clause to a query
	 * @method groupBy
	 * @param {Db_Expression|string} $expression
	 * @chainable
	 */
	function groupBy ($expression);

	/**
	 * Adds a HAVING clause to a query
	 * @method having
	 * @param {Db_Expression|array} $criteria An associative array of expression => value pairs.
	 *  The values are automatically escaped using PDO placeholders.
	 *  Or, this could be a Db_Expression object.
	 * @chainable
	 */
	function having ($criteria);

	
	/**
	 * Adds an ORDER BY clause to the query
	 * @method orderBy
	 * @param {Db_Expression|string} $expression A string or Db_Expression with the expression to order the results by.
	 * @param {boolean} [$ascending=true] If false, sorts results as ascending, otherwise descending.
	 * @chainable
	 */
	function orderBy ($expression, $ascending = true);

	/**
	 * Adds optional LIMIT and OFFSET clauses to the query
	 * @method limit
	 * @param {integer} $limit A non-negative integer showing how many rows to return
	 * @param {integer} [$offset=null] Optional. A non-negative integer showing what row to start the result set with.
	 * @chainable
	 */
	function limit ($limit, $offset = null);

	
	/**
	 * Adds a SET clause to an UPDATE statement
	 * @method set
	 * @param {array} $updates An associative array of column => value pairs. 
	 *  The values are automatically escaped using PDO placeholders.
	 * @chainable
	 */
	function set (array $updates);

	/**
	 * Fetches an array of database rows matching the query.
	 * If this exact query has already been executed and
	 * fetchAll() has been called on the Db_Result, and
	 * the return value was cached by the Db_Result, then
	 * that cached value is returned, unless $this->ignoreCache is true.
	 * Otherwise, the query is executed and fetchAll() is called on the result.
	 * 
	 * See [PDO documentation](http://us2.php.net/manual/en/pdostatement.fetchall.php)
	 * @method fetchAll
	 * @param {enum} $fetch_style=PDO::FETCH_BOTH
	 * @param {enum} $column_index=null
	 * @param {array} $ctor_args=null
	 * @return {array}
	 */
	function fetchAll(
		$fetch_style = PDO::FETCH_BOTH, 
		$column_index = null,
		array $ctor_args = array());
		
	/**
	 * Fetches an array of Db_Row objects.
	 * If this exact query has already been executed and
	 * fetchAll() has been called on the Db_Result, and
	 * the return value was cached by the Db_Result, then
	 * that cached value is returned, unless $this->ignoreCache is true.
	 * Otherwise, the query is executed and fetchDbRows() is called on the result.
	 * @method fetchDbRows
	 * @param {string} [$class_name='Db_Row'] The name of the class to instantiate and fill objects from.
	 *  Must extend Db_Row.
	 * @param {string} [$fields_prefix=''] This is the prefix, if any, to strip out when fetching the rows.
	 * @param {string} [$by_field=null] A field name to index the array by.
	 *  If the field's value is NULL in a given row, that row is just appended
	 *  in the usual way to the array.
	 * @return {array}
	 */
	function fetchDbRows(
		$class_name = 'Db_Row', 
		$fields_prefix = '',
		$by_field = null
	);

	/**
	 * Adds an ON DUPLICATE KEY UPDATE clause to an INSERT statement.
	 * Use only with MySQL.
	 * @method onDuplicateKeyUpdate
	 * @param {array} $updates An associative array of column => value pairs. 
	 *  The values are automatically escaped using PDO placeholders.
	 * @chainable
	 */
	function onDuplicateKeyUpdate ($updates);

	/**
	 * This function provides an easy way to provide additional clauses to the query.
	 * @method options
	 * @param {array} $options An associative array of key => value pairs, where the key is 
	 *  the name of the method to call, and the value is the array of arguments. 
	 *  If the value is not an array, it is wrapped in one.
	 * @chainable
	 */
	function options ($options);

};

/**
 * This class lets you create and use Db queries.
 * @class Db_Query
 * @extends Db_Expression
 */

abstract class Db_Query extends Db_Expression
{	
	/*
	 * Types of queries available right now
	 */
	/**
	 * Raw query
	 * @property TYPE_RAW
	 * @type integer
	 * @final
	 */
	const TYPE_RAW = 1;
	/**
	 * Select query
	 * @property TYPE_SELECT
	 * @type integer
	 * @final
	 */
	const TYPE_SELECT = 2;
	/**
	 * Insert query
	 * @property TYPE_INSERT
	 * @type integer
	 * @final
	 */
	const TYPE_INSERT = 3;
	/**
	 * Update query
	 * @property TYPE_UPDATE
	 * @type integer
	 * @final
	 */
	const TYPE_UPDATE = 4;
	/**
	 * Delete query
	 * @property TYPE_DELETE
	 * @type integer
	 * @final
	 */
	const TYPE_DELETE = 5;
	/**
	 * Rollback query
	 * @property TYPE_ROLLBACK
	 * @type integer
	 * @final
	 */
	const TYPE_ROLLBACK = 6;
	
	/**
	 * Default length of the hash used for sharding
	 * @property HASH_LEN
	 * @type integer
	 * @final
	 * @default 7
	 */
	const HASH_LEN = 7;

	function copy()
	{
		// We only have to do a shallow copy of the object,
		// because all its properties are arrays, and PHP will copy-on-write
		// them when we modify them in the copy.
		return clone($this);
	}
	
	/**
	 * This method returns the shard index that is used, if any.
	 */
	function shardIndex()
	{
		if (isset($this->cachedShardIndex)) {
			return $this->cachedShardIndex;
		}
		if (!$this->className) {
			return null;
		}
		$conn_name = $this->db->connectionName();
		$class_name = substr($this->className, strlen($conn_name)+1);
		$info = Q_Config::get('Db', 'upcoming', $conn_name, false);
		if (!$info) {
			$info = Q_Config::get('Db', 'connections', $conn_name, array());
		}
		return $this->cachedShardIndex = isset($info['indexes'][$class_name])
			? $info['indexes'][$class_name]
			: null;
	}

	/**
	 * Analyzes the query's criteria and decides where to execute the query.
	 * Here is sample shards config:
	 * 
	 * **NOTE:** *"fields" shall be an object with keys as fields names and values containing hash definition
	 * 		in the format "type%length" where type is one of 'md5' or 'normalize' and length is hash length
	 * 		hash definition can be empty string or false. In such case 'md5%7' is used*
	 *
	 * **NOTE:** *"partition" can be an array. In such case shards shall be named after partition points*
	 *
	 *
	 *	"Streams": {
	 *		"prefix": "streams_",
	 *		"dsn": "mysql:host=127.0.0.1;dbname=DBNAME",
	 *		"username": "USER",
	 *		"password": "PASSWORD",
	 *		"driver_options": {
	 *			"3": 2
	 *		},
	 *		"shards": {
	 *			"alpha": {
	 *				"prefix": "alpha_",
	 *				"dsn": "mysql:host=127.0.0.1;dbname=SHARDDBNAME",
	 *				"username": "USER",
	 *				"password": "PASSWORD",
	 *				"driver_options": {
	 *					"3": 2
	 *				}
	 *			},
	 *			"betta": {
	 *				"prefix": "betta_",
	 *				"dsn": "mysql:host=127.0.0.1;dbname=SHARDDBNAME",
	 *				"username": "USER",
	 *				"password": "PASSWORD",
	 *				"driver_options": {
	 *					"3": 2
	 *				}
	 *			},
	 *			"gamma": {
	 *				"prefix": "gamma_",
	 *				"dsn": "mysql:host=127.0.0.1;dbname=SHARDDBNAME",
	 *				"username": "USER",
	 *				"password": "PASSWORD",
	 *				"driver_options": {
	 *					"3": 2
	 *				}
	 *			},
	 *			"delta": {
	 *				"prefix": "delta_",
	 *				"dsn": "mysql:host=127.0.0.1;dbname=SHARDDBNAME",
	 *				"username": "USER",
	 *				"password": "PASSWORD",
	 *				"driver_options": {
	 *					"3": 2
	 *				}
	 *			}
	 *		},
	 *		"indexes": {
	 *			"Stream": {
	 *				"fields": {"publisherId": "md5", "name": "normalize"},
	 *				"partition": {
	 *					"0000000.       ": "alpha",
	 *					"0000000.sample_": "betta",
	 *					"4000000.       ": "gamma",
	 *					"4000000.sample_": "delta",
	 *					"8000000.       ": "alpha",
	 *					"8000000.sample_": "betta",
	 *					"c000000.       ": "gamma",
	 *					"c000000.sample_": "delta"
	 *				}
	 *			}
	 *		}
	 *	}
	 *
	 * @method shard
	 * @param {array} [$upcoming=null] Temporary config to use in sharding. Used during shard split process only
	 * @param {array} [$criteria=null] Overrides the sharding criteria for the query. Rarely used unless testing what shards the query would be executed on. 
	 * @return {array} Returns an array of ($shardName => $query) pairs, where $shardName
	 *  can be the name of a shard, '' for just the main shard, or "*" to have the query run on all the shards.
	 */
	function shard($upcoming = null, $criteria = null)
	{
		if (isset($criteria)) {
			$this->criteria = $criteria;
		}
		$index = $this->shardIndex();
		if (!$index) {
			return array("" => $this);
		}
		if (empty($this->criteria)) {
			return array("*" => $this);
		}
		if (empty($index['fields'])) {
			throw new Exception("Db_Query: index for {$this->className} should have at least one field");
		}
		if (!isset($index['partition'])) {
			return array("" => $this);
		}
		$hashed = array();
		$fields = array_keys($index['fields']);
		foreach ($fields as $i => $field) {
			if (!isset($this->criteria[$field])) {
				// not enough information to target the query
				return array("*" => $this);
			}
			$value = $this->criteria[$field];
			$hash = !empty($index['fields'][$field]) ? $index['fields'][$field] : 'md5';
			$parts = explode('%', $hash);
			$hash = $parts[0];
			$len = isset($parts[1]) ? $parts[1] : self::HASH_LEN;
			if (is_array($value)) {
				$arr = array();
				foreach ($value as $v) {
					$arr[] = self::applyHash($v, $hash, $len);
				}
				$hashed[$i] = $arr;
			} else if ($value instanceof Db_Range) {
				if ($hash !== 'normalize') {
					throw new Exception("Db_Query: ranges don't work with $hash hash");
				}
				$hashed_min = self::applyHash($value->min, $hash, $len);
				$hashed_max = self::applyHash($value->max, $hash, $len);
				$hashed[$i] = new Db_Range(
					$hashed_min, $value->includeMin, $value->includeMax, $hashed_max
				);
			} else {
				$hashed[$i] = self::applyHash($value, $hash, $len);
			}
		}
		if (array_keys($index['partition']) === range(0, count($index['partition']) - 1)) {
			// $index['partition'] is simple array, name the shards after the partition points
			self::$mapping = array_combine($index['partition'], $index['partition']);
		} else {
			self::$mapping = $index['partition'];
		}
		return $this->shard_internal($index, $hashed);
	}

	/**
	 * Calculate hash of the value
	 * @method hashed
	 * @param {string} $value
	 * @param {string} [$hash=null] Hash is one of 'md5' or 'normalize' optionally followed by '%' and number
	 * @return {string}
	 */
	static function hashed($value, $hash = null)
	{
		$hash = !isset($hash) ? $hash : 'md5';
		$parts = explode('%', $hash);
		$hash = $parts[0];
		$len = isset($parts[1]) ? $parts[1] : self::HASH_LEN;
		return self::applyHash($value, $hash, $len);
	}
	
	/**
	 * Returns an array of field names that are "magic" when used
	 * @return {array}
	 */
	static function magicFieldNames()
	{
		return array('insertedTime', 'updatedTime', 'created_time', 'updated_time');
	}

	/**
	 * Calculates hash of the value
	 * @method applyHash
	 * @private
	 * @param {string} $value
	 * @param {string} [$hash='normalize']
	 * @param {integer} [$len=self::HASH_LEN]
	 * @return {string}
	 */
	private static function applyHash($value, $hash = 'normalize', $len = self::HASH_LEN)
	{
		if (!isset($value)) {
			return $value;
		}
		switch ($hash) {
			case 'normalize':
				$hashed = substr(Db::normalize($value), 0, $len);
				break;
			case 'md5':
				$hashed = substr(md5($value), 0, $len);
				break;
			default:
				throw new Exception("Db_Query: The hash $hash is not supported");
		}
		// each hash shall have fixed lenngth. Space is less than any char used in hash so
		// let's pad the result to desired length with spaces
		return str_pad($hashed, $len, " ", STR_PAD_LEFT);
	}
	
	/**
	 * does a depth first search
	 * and returns the array of shardname => $query pairs
	 * corresponding to which shards are affected
	 * @method shard_internal
	 * @private
	 * @param {array} $index
	 * @param {string} $hashed
	 * @return {array}
	 */
	private function shard_internal($index, $hashed)
	{
		// $index['partition'] shall contain strings "XXXXXX.YYYYYY.ZZZZZZ" where each point has full length of the hash
		$partition = array();
		$last_point = null;
		foreach (array_keys(self::$mapping) as $i => $point) {
			$partition[$i] = explode('.', $point);
			if (isset($last_point) and strcmp($point, $last_point) <= 0) {
				throw new Exception("Db_Query shard_internal: in {$this->className} partition, point $i is not greater than the previous point");
			}
			$last_point = $point;
		}
		$keys = array_map(
			array($this, "map_shard"), 
			self::slice_partitions($partition, 0, $hashed)
		);
		return array_fill_keys($keys, $this);
	}

	/**
	 * Narrows the partition list according to hashes
	 * @method slice_partitions
	 * @private
	 * @param {array} $partition
	 * @param {integer} $j Currently processed hashed array member
	 * @param {array} $hashed
	 * @param {boolean} [$adjust=false]
	 * @return {array}
	 */
	static private function slice_partitions($partition, $j, $hashed, $adjust = false) {
		// if hashed[$field] is a string only one point shall be found
		// if hashed[$field] is an array, let's process each array member
		// if hashed[$field] is range return all shards from interval min-max
		// do this recursively for each field one by one

		if (count($partition) <= 1) return $partition;

		// this shall be set!
		$hj = $hashed[$j];

		if (is_array($hj)) {
			$result = array();
			$temp = $hashed;
			foreach ($hj as $h) {
				$temp[$j] = $h;
				$result = array_merge(
					$result, 
					self::slice_partitions($partition, $j, $temp, $adjust)
				);
			}
			// $result may contain duplicates!
			return $result;
		}

		// $hj is a string or Db_Range
		$min = $max = $hj;
		$includeMax = true;
		if ($hj instanceof Db_Range) {
			$min = $hj->min;
			$max = $hj->max;
			if (!isset($min)) {
				throw new Exception("Db_Query_Mysql slice_partitions: The minimum of the range should be set.");
			}
			//$includeMax = $hj->includeMax;
		}
		// the first item to keep
		$lower = 0;
		// the last item to keep
		$upper = count($partition)-1;
		// we need this if adjusting result for range search
		$lower_found = $upper_found = false;

		foreach ($partition as $i => $point) {
			// $upper_found shall be reset in each block
			$upper_found = $upper_found && isset($next);
			$current = $point[$j];
			// if $current is bigger than $max nothing to check anymore.
			// but if we adjust for range, we shall look trough all partition again 
			// to find upper bound at the end of partition array
			if (!$adjust && isset($max) && ($includeMax ? strcmp($current, $max) > 0 : strcmp($current, $max) >= 0)) break;
			// we shall wait till $current and $next are different
			if (($next = isset($partition[$i+1][$j]) ? $partition[$i+1][$j] : null) === $current) continue;
			// when adjusting $next may be less than $current but $lower is already found
			if ($adjust && strcmp($current, $next) > 0) $lower_found = !($next = null);

			// check lower bound we can skip all $partition up to $next but keep $next
			if (!$lower_found && (isset($next) && strcmp($min, $next) >= 0)) $lower = $i+1;

			// now check $next. That's the first time when $max < $next so we've found upper bound
			if (!$upper_found)
				if (!isset($next) || ($includeMax ? strcmp($max, $next) < 0 : strcmp($max, $next) <= 0)) {
					// we have found upper bound. We can skip all partitions starting from the $next
					$upper = $i;
					if (!$adjust) break;
					else $upper_found = true;
				}
		}

		// we are not interested in points up to $lower and over $upper
		// if $hj is Db_Range - check upper bound
		// if we have checked all $hashed - nothing to check anymore,
		// otherwise - check the rest of $hashed
		if (isset($hashed[$j+1])) {
			return self::slice_partitions(
				array_slice($partition, $lower, $upper-$lower+1), 
				$j+1, $hashed, $hj instanceof Db_Range || $adjust
			);
		} else {
			return array_slice($partition, $lower, $upper-$lower+1);
		}
	}

	/**
	 * Make partition from array of points
	 * @method map_shard
	 * @private
	 * @param {array} $a
	 * @return {string}
	 */
	static private function map_shard($a) {
		return self::$mapping[implode('.', $a)];
	}

	/**
	 * Actual points mapping depending if partition is plain or associative array
	 * @property $mapping
	 * @type array
	 * @private
	 */
	static private $mapping = null;
	/**
	 * Class cache
	 * @property $cache
	 * @type array
	 */
	static $cache = array();
	
	protected $cachedShardIndex = null;

}
