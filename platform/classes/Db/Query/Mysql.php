<?php

/**
 * @module Db
 */

class Db_Query_Mysql extends Db_Query implements Db_Query_Interface
{
	/**
	 * This class lets you create and use Db queries
	 * @class Db_Query_Mysql
	 * @extends Db_Query
	 * @constructor
	 * @param {Db_Interface} $db An instance of a Db adapter
	 * @param {integer} $type The type of the query. See class constants beginning with TYPE_ .
	 * @param {array} [$clauses=array()] The clauses to add to the query right away
	 * @param {array} [$parameters=array()] The parameters to add to the query right away (to be bound when executing). Values corresponding to numeric keys replace question marks, while values corresponding to string keys replace ":key" placeholders, in the SQL.
	 * @param {array} [$tables=null] The tables operated with query
	 */
	function __construct (
		Db_Interface $db,
		$type,
		array $clauses = array(),
		array $parameters = array(),
		$table = null)
	{
		$this->db = $db;
		$this->type = $type;
		$this->table = $table;
		$this->parameters = array();
		foreach ($parameters as $key => $value) {
			if ($value instanceof Db_Expression) {
				if (is_array($value->parameters)) {
					$this->parameters = array_merge(
						$this->parameters,
						$value->parameters);
				}
			} else {
				$this->parameters[$key] = $value;
			}
		}

		// and now, for sharding
		if ($type === Db_Query::TYPE_INSERT || $type === Db_Query::TYPE_ROLLBACK) {
			$this->criteria = $parameters;
		}

		$conn = $this->db->connection();
		$prefix = empty($conn['prefix']) ? '' : $conn['prefix'];
		$this->replacements = array(
			'{{prefix}}' => $prefix
		);
		if (isset($db->dbname)) {
			$this->replacements['{{dbname}}'] = $db->dbname;
		}

		// Put default contents in the clauses
		// in case the query gets run.
		if (count($clauses) > 0) {
			$this->clauses = $clauses;
		} else {
			switch ($type) {
				case Db_Query::TYPE_SELECT:
					$this->clauses = array(
						'SELECT' => '',
						'FROM' => '',
						'WHERE' => ''
					);
					break;
				case Db_Query::TYPE_INSERT:
					$this->clauses = array('INTO' => '', 'VALUES' => '');
					break;
				case Db_Query::TYPE_UPDATE:
					$this->clauses = array(
						'UPDATE' => array(),
						'SET' => array()
					);
					break;
				case Db_Query::TYPE_DELETE:
					break;
				case Db_Query::TYPE_RAW:
					break;
				case Db_Query::TYPE_ROLLBACK:
					$this->clauses = array("ROLLBACK" => true);
					break;
				default:
					throw new Exception("unknown query type", - 1);
			}
		}
	}

	/**
	 * The object implementing Db_Interface that this query uses
	 * @property $db
	 * @type Db_Mysql
	 */
	public $db;

	/**
	 * The type of query this is (select, insert, etc.)
	 * @property $type
	 * @type integer
	 */
	public $type;

	/**
	 * The tables operated with query
	 * @property $table
	 * @type string
	 */
	public $table;

	/**
	 * The name of the class to instantiate when fetching database rows.
	 * @property $className
	 * @type string
	 */
	public $className;

	/**
	 * Clauses that this query has (WHERE, ORDER BY, etc.)
	 * @property $clauses
	 * @type array
	 * @default array()
	 */
	protected $clauses = array();

	/**
	 * Any additional text that comes after a clause
	 * @property $after
	 * @type array
	 * @default array()
	 */
	protected $after = array();

	/**
	 * The parameters passed to this query
	 * @property $parameters
	 * @type array
	 * @default array()
	 */
	public $parameters = array();

	/**
	 * If this query is prepared, this would point to the
	 * PDOStatement object
	 * @property $statement
	 * @type PDOStatement
	 * @default null
	 */
	protected $statement = null;

	/**
	 * The context of the query. Contains the following keys:
	 *
	 * * 'callback' => the function or method to call back
	 * * 'args' => the arguments to pass to that function or method
	 *
	 * @property $context
	 * @type array
	 * @default null
	 */
	protected $context = null;

	/**
	 * Strings to replace in the query, if getSQL() or execute() is called
	 * @property $replacements
	 * @type array
	 * @default array()
	 */
	protected $replacements = array();

	/**
	 * Whether to use the cache or not
	 * @property $ignoreCache
	 * @type boolean
	 * @default false
	 */
	protected $ignoreCache = false;

	/**
	 * Criteria used for sharding the query
	 * @property $criteria
	 * @type array
	 * @default array()
	 */
	protected $criteria = array();

	/**
	 * Whether to cache or not
	 * @property $caching
	 * @type boolean
	 * @default false
	 */
	protected $caching = null;

	/**
	 * If cached data already exists on fetchAll and fetchDbRows, ignore it.
	 * @method ignoreCache
	 * @chainable
	 */
	function ignoreCache()
	{
		$this->ignoreCache = true;
		return $this;
	}

	/**
	 * Turn off automatic caching on fetchAll and fetchDbRows.
	 * @method caching
	 * @param {boolean} [$mode=null] Pass false to suppress all caching. Pass true to cache everything. The default is null, which caches everything except empty results.
	 * @return {Db_Query_Mysql}
	 */
	function caching($mode = null)
	{
		$this->caching = $mode;
		return $this;
	}
	
	/**
	 * Builds the query from the clauses
	 * @method build
	 * @return {string} The SQL query built according to defined clauses
	 * @throws {Exception} Exception is thrown in case mandatory clause is missing
	 */
	function build ()
	{
		if ($this->type !== Db_Query::TYPE_RAW) {
			// WHERE
			$where = empty($this->clauses['WHERE']) ? '' : "\nWHERE ".$this->clauses['WHERE'];
			$where .= !isset($this->after['WHERE']) ? '' : "\n".$this->after['WHERE'];
			// ORDER BY
			$orderBy = empty($this->clauses['ORDER BY']) ? '' : "\nORDER BY " . $this->clauses['ORDER BY'];
			$orderBy .= !isset($this->after['ORDER BY']) ? '' : "\n".$this->after['ORDER BY'];
			// LIMIT and OFFSET
			$limit = empty($this->clauses['LIMIT']) ? '' : "\n LIMIT ".$this->clauses['LIMIT'];
			$limit .= !isset($this->after['LIMIT']) ? '' : "\n".$this->after['LIMIT'];
		}
		
		$joinClauses = isset($this->clauses['JOIN']) ? $this->clauses['JOIN'] : '';
		if ($this->useDeferredJoin and $this->className) {
			$className = $this->className;
			$row = new $className();
			$table = call_user_func(array($className, 'table'));
			$pk = implode(', ', $row->getPrimaryKey());
			$subquery = "  SELECT $pk FROM $table$where$orderBy$limit";
			$joinClauses = "INNER JOIN (\n$subquery\n) Db_deferredJoinDerivedTable USING($pk)" . $joinClauses;
			$where = ''; // because we already did it in the INNER JOIN, and the subquery will be executed first
			$limit = ''; // we don't need it in the outer query for the same reason, but we still want orderBy clause
		}
		$q = '';
		switch ($this->type) {
			case Db_Query::TYPE_RAW:
				$q = isset($this->clauses['RAW'])
					? $this->clauses['RAW']
					: '';
				break;
			case Db_Query::TYPE_SELECT:
				// SELECT
				$select = empty($this->clauses['SELECT']) ? '*' : $this->clauses['SELECT'];
				$select .= !isset($this->after['SELECT']) ? '' : $this->after['SELECT'];
				// FROM
				if (!isset($this->clauses['FROM']))
					throw new Exception("missing FROM clause in DB query.", -1);
				$from = empty($this->clauses['FROM']) ? '' : "\nFROM ". $this->clauses['FROM'];
				$from .= !isset($this->after['FROM']) ? '' : "\n".$this->after['FROM'];
				// JOIN
				$join = empty($joinClauses) ? '' : "\n".$joinClauses;
				$join .= !isset($this->after['JOIN']) ? '' : "\n".$this->after['JOIN'];
				// GROUP BY
				$groupBy = empty($this->clauses['GROUP BY']) ? '' : "\nGROUP BY " . $this->clauses['GROUP BY'];
				$groupBy .= !isset($this->after['GROUP BY']) ? '' : "\n".$this->after['GROUP BY'];
				// HAVING
				$having = empty($this->clauses['HAVING']) ? '' : "\nHAVING " . $this->clauses['HAVING'];
				$having .= !isset($this->after['HAVING']) ? '' : "\n".$this->after['HAVING'];
				// LOCK
				$lock = empty($this->clauses['LOCK']) ? '' : "\n".$this->clauses['LOCK'];
				$lock .= !isset($this->after['LOCK']) ? '' : "\n".$this->after['LOCK'];
				$q = "SELECT $select$from$join$where $groupBy $having $orderBy $limit $lock";
				if (!empty($this->clauses['EXISTS'])) {
					$q = "EXISTS(\n$q\n)";
				} else if (!empty($this->clauses['NOT EXISTS'])) {
					$q = "NOT EXISTS(\n$q\n)";
				}
				break;
			case Db_Query::TYPE_INSERT:
				// INTO
				if (empty($this->clauses['INTO']))
					throw new Exception("missing INTO clause in DB query.", -2);
				$into = empty($this->clauses['INTO']) ? '' : $this->clauses['INTO'];
				$into .= !isset($this->after['INTO']) ? '' : $this->after['INTO'];
				// VALUES
				if (!isset($this->clauses['VALUES']))
				   throw new Exception("Missing VALUES clause in DB query.", -3);
				$values = $this->clauses['VALUES'];
				$afterValues = !isset($this->after['VALUES']) ? '' : "\n".$this->after['VALUES'];
				if (empty($this->clauses['ON DUPLICATE KEY UPDATE']))
					$onDuplicateKeyUpdate = '';
				else
					$onDuplicateKeyUpdate = "\nON DUPLICATE KEY UPDATE " . $this->clauses['ON DUPLICATE KEY UPDATE'];
				$q = "INSERT INTO $into \nVALUES ( $values ) $afterValues$onDuplicateKeyUpdate";
				break;
			case Db_Query::TYPE_UPDATE:
				// UPDATE
				if (empty($this->clauses['UPDATE']))
					throw new Exception("Missing UPDATE tables clause in DB query.", -2);
				$update = $this->clauses['UPDATE'];
				$update .= !isset($this->after['UPDATE']) ? '' : "\n".$this->after['UPDATE'];
				if (empty($this->clauses['SET']))
					throw new Exception("missing SET clause in DB query.", -3);
				// JOIN
				$join = empty($joinClauses) ? '' : "\n".$joinClauses;
				$join .= !isset($this->after['JOIN']) ? '' : "\n".$this->after['JOIN'];
				// SET
				$set = empty($this->clauses['SET']) ? '' : "\nSET ".$this->clauses['SET'];
				$set .= !isset($this->after['SET']) ? '' : "\n".$this->after['SET'];
				// WHERE
				if (empty($this->clauses['WHERE']))
					$where = "";
				else
					$where = "\nWHERE " . $this->clauses['WHERE'];
				$where .= !isset($this->after['WHERE']) ? '' : "\n".$this->after['WHERE'];
				// LIMIT
				$limit = empty($this->clauses['LIMIT']) ? '' : "\n LIMIT ".$this->clauses['LIMIT'];
				$limit .= !isset($this->after['LIMIT']) ? '' : "\n".$this->after['LIMIT'];
				$q = "UPDATE $update$join$set$where$limit";
				break;
			case Db_Query::TYPE_DELETE:
				// DELETE
				if (empty($this->clauses['FROM']))
					throw new Exception("missing FROM clause in DB query.", -2);
				$from = "FROM ".$this->clauses['FROM'];
				$from .= !isset($this->after['FROM']) ? '' : $this->after['FROM'];
				// JOIN
				$join = empty($joinClauses) ? '' : "\n".$joinClauses;
				$join .= !isset($this->after['JOIN']) ? '' : "\n".$this->after['JOIN'];
				$q = "DELETE $from$join$where$limit";
				break;
		}
		foreach ($this->replacements as $k => $v) {
			$q = str_replace($k, $v, $q);
		}
		return $q;
	}

	/**
	 * Convert Db_Query_Mysql to it's representation
	 * @method __toString
	 * @return {string}
	 */
	function __toString ()
	{
		try {
			$repres = $this->build();
		} catch (Exception $e) {
			return '*****' . $e->getMessage();
		}
		return $repres;
	}

	/**
	 * @method replaceKeysCompare
	 * @private
	 * @return {integer}
	 */
	private static function replaceKeysCompare($a, $b)
	{
		$aIsInteger = (is_numeric($a) and intval($a) == $a);
		$bIsInteger = (is_numeric($b) and intval($b) == $b);
		if ($aIsInteger and !$bIsInteger) {
			return 1;
		}
		if ($bIsInteger and !$aIsInteger) {
			return -1;
		}
		if ($aIsInteger and $bIsInteger) {
			return intval($a) - intval($b);
		}
		return strlen($b)-strlen($a);
	}

	/**
	 * Gets the SQL that would be executed with the execute() method. See {{#crossLink "Db_Query_Mysql/build"}}{{/crossLink}}.
	 * @method getSQL
	 * @param {callable} [$callback=null] If not set, this function returns the generated SQL string.
	 * If it is set, this function calls $callback, passing it the SQL string, and then returns $this, for chainable interface.
	 * @param {boolean} [$template=false]
	 * @return {string|Db_Query} Depends on whether $callback is set or not.
	 * @throws {Exception} This function calls self::build()
	 */
	function getSQL ($callback = null, $template = false)
	{
		if (!$template) {
			if (isset($this->db->dbname)) {
				$this->replacements['{{dbname}}'] = $this->db->dbname;
			}
			$this->replacements['{{prefix}}'] = isset($this->db->prefix)
				? $this->db->prefix
				: '';
		}
		$repres = $this->build();
		$keys = array_keys($this->parameters);
		usort($keys, array(__CLASS__, 'replaceKeysCompare'));
		foreach ($keys as $key) {
			$value = $this->parameters[$key];
			if (!isset($value)) {
				$value2 = "NULL";
			} else if ($value instanceof Db_Expression) {
				$value2 = $value;
			} else {
				$value2 = $this->reallyConnect()->quote($value);
			}
			if (is_numeric($key) and intval($key) == $key) {
				// replace one of the question marks
				if (false !== ($pos = strpos($repres, '?'))) {
					$repres = substr($repres, 0, $pos) . (string)$value2 . substr($repres, $pos+1);
				}
			} else {
				// we don't use $repres = str_replace(":$key", "$value2", $repres);
				// because we want to replace only one occurrence
				if (false !== ($pos = strpos($repres, ":$key"))) {
					$pos2 = $pos + strlen(":$key");
					$repres = substr($repres, 0, $pos) . (string)$value2 . substr($repres, $pos2);
				}
			}
		}
		foreach ($this->replacements as $k => $v) {
			$repres = str_replace($k, $v, $repres);
		}
		if (isset($callback)) {
			$args = array($repres);
			Q::call($callback, $args);
			return $this;
		}
		return $repres;
	}

	/**
	 * Gets a clause from the query
	 * @method getClause
	 * @param {string} $clauseName
	 * @param {boolean} [$withAfter=false]
	 * @return {mixed} If $withAfter is true, returns array($clause, $after) otherwise just returns $clause
	 */
	function getClause($clauseName, $withAfter = false)
	{
		$clause = isset($this->clauses[$clauseName])
			? $this->clauses[$clauseName]
			: '';
		if (!$withAfter) {
			return $clause;
		}
		$after = isset($this->after[$clauseName])
			? $this->after[$clauseName]
			: '';
		return array($clause, $after);
	}

	/**
	 * Merges additional replacements over the default replacement array,
	 * which is currently just
	 * @example
	 *      array (
	 *         '{{prefix}}' => $conn['prefix']
	 *      )
	 *
	 * The replacements array is used to replace strings in the SQL before using it. Watch out,
	 * because it may replace more than you want!
	 * @method replace
	 * @param {array} [$replacements=array()] This must be an array.
	 */
	function replace(array $replacements = array())
	{
		$this->replacements = array_merge($this->replacements, $replacements);
	}

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
	 * where :name is a placeholder for the parameter under the key "name".
	 * The parameters will be properly escaped. You can also have the query contain question marks (the binding is
	 * done using PDO), but then the order of the parameters matters.
	 * @return {Db_Query_Mysql}  The resulting object implementing Db_Query_Interface.
	 * @chainable
	 */
	function bind(array $parameters = array())
	{
		foreach ($parameters as $key => $value) {
			if ($value instanceof Db_Expression) {
				if (is_array($value->parameters)) {
					$this->parameters = array_merge(
						$this->parameters,
						$value->parameters
					);
				}
			} else {
				$this->parameters[$key] = $value;
			}
		}
		return $this;
	}

	/**
	 * Executes a query against the database and returns the result set.
	 * @method excecute
	 * @param {boolean} [$prepareStatement=false] If true, a PDO statement will be prepared
	 * from the query before it is executed. It is also saved for future invocations to use.
	 * Do this only if the statement will be executed many times with
	 * different parameters. Basically you would use ->bind(...) between
	 * invocations of ->execute().
	 * @param {array|string} [$shards] You can pass a shard name here, or a
	 *  numerically indexed array of shard names, or an associative array
	 *  where the keys are shard names and the values are the query to execute.
	 *  This will bypass the usual sharding algorithm.
	 * @return {Db_Result} The Db_Result object containing the PDO statement that resulted from the query.
	 */
	function execute ($prepareStatement = false, $shards = null)
	{
		if (class_exists('Q')) {
			/**
			 * @event Db/query/execute {before}
			 * @param {Db_Query_Mysql} query
			 * @return {Db_Result}
			 */
			$result = Q::event('Db/query/execute', array('query' => $this), 'before');
		}
		if (isset($result)) {
			return $result;
		}

		$stmts = array();
		// make sure SQL template will be ready for sharding. reallyConnect will add new values
		unset($this->replacements['{{dbname}}']);
		unset($this->replacements['{{prefix}}']);

		$this->startedTime = Q::milliseconds(true);

		if ($prepareStatement) {
			// Prepare the query into a SQL statement
			// this takes two round-trips to the database

			// Preparing the statement if it wasn't yet set
			if (!isset($this->statement)) {
				if ($q = $this->build()) {
					$pdo = $this->reallyConnect();
					$this->statement = $pdo->prepare($q);
					if ($this->statement === false) {
						if (!isset($sql)) {
							$sql = $this->getSQL();
						}
						if (!class_exists('Q_Exception_DbQuery')) {
							throw new Exception("query could not be prepared [query was: $sql ]", - 1);
						}
						throw new Q_Exception_DbQuery(array(
							'sql' => $sql,
							'msg' => 'query could not be prepared'
						));
					}
				}
			}

			// Bind the parameters
			foreach ($this->parameters as $key => $value) {
				$this->statement->bindValue($key, $value);
			}
		}

		$sql_template = $this->getSQL(null, true);

		if (isset($shards)) {
			if (is_string($shards)) {
				$shards = array($shards);
			}
			if (Q::isAssociative($shards)) {
				$queries = $shards;
			} else {
				$queries = array_fill_keys($shards, $this);
			}
		} else {
			$queries = $this->shard();
		}
		$connection = $this->db->connectionName();

		if (!empty($queries["*"])) {
			$shardNames = Q_Config::get(
				'Db', 'connections', $connection, 'shards', array('' => '')
			);
			$q = $queries["*"];
			foreach ($shardNames as $k => $v) {
				$queries[$k] = $q;
			}
			unset($queries['*']);
		}

		foreach ($queries as $shardName => $query) {

			$upcoming = Q_Config::get('Db', 'upcoming', $connection, false);
			if ($query->type !== Db_Query::TYPE_SELECT && $query->type !== Db_Query::TYPE_RAW) {
				if (!empty($upcoming['block']) && $shardName === $upcoming['shard']) {
					throw new Db_Exception_Blocked(@compact('shardName', 'connection'));
				}
			}
			
			$query->startedTime = Q::milliseconds(true);

			$shardInfo = null;
			$pdo = $query->reallyConnect($shardName, $shardInfo);
			$dsn = $shardInfo['dsn'];
			$nt = & self::$nestedTransactions[$dsn];
			if (!isset($nt)) {
				$nt = & self::$nestedTransactions[$dsn];
				$nt = array(
					'count' => 0,
					'keys' => array(),
					'connections' => array(),
					'backtraces' => array()
				);
			}
			$ntc = & $nt['count'];
			$ntk = & $nt['keys'];
			$ntct = & $nt['connections'];
			$ntbt = & $nt['backtraces'];

			$sql = $query->getSQL(); // depends on shard, possibly
			// TODO: implement caching sql until query changes

			try {
				if (!empty($query->clauses["BEGIN"])) {
					$ntk[] = Q::ifset($query, 'transactionKey', null);
					$ntct[] = $connection;
					//$ntbt[] = Q::b();
					if (++$ntc == 1) {
						$pdo->beginTransaction();
					}
				} else if (!empty($query->clauses["ROLLBACK"])) {
					$pdo->rollBack();
					$ntc = 0;
					$ntk = array();
				}

				if ($query->type !== Db_Query::TYPE_ROLLBACK) {
					if ($prepareStatement) {
						// Execute the statement
						try {
							$query->statement->execute();
							$stmt = $query->statement;
						} catch (Exception $e) {
							if (!isset($sql)) {
								$sql = $query->getSQL();
							}
							if (!class_exists('Q_Exception_DbQuery')) {
								throw new Exception($e->getMessage() . " [query was: $sql]", -1);
							}
							throw new Q_Exception_DbQuery(array(
								'shardName' => $shardName,
								'query' => $query,
								'sql' => $sql,
								'msg' => $e->getMessage()
							));
						}
					} else {
						// Obtain the full SQL code ourselves
						// and send to the database, without preparing it there.
						if ($sql) {
							$stmt = $pdo->query($sql);
						} else {
							$stmt = true;
						}
					}

					$stmts[] = $stmt;
					if (!empty($query->clauses["COMMIT"]) && $ntc) {
						// we commit only if no error occurred - warnings are permitted
						if (!$stmt or ($stmt !== true and !in_array(
							substr($stmt->errorCode(), 0, 2), 
							array('00', '01')
						))) {
							$err = $pdo->errorInfo();
							throw new Exception($err[0], $err[1]);
						}
						$lastTransactionKey = array_pop($ntk);
						if ($lastTransactionKey
						and $query->transactionKey !== $lastTransactionKey
						and $query->transactionKey !== '*') {
							Q::log("WARNING: Forgot to resolve transactions via commit or rollback");
							foreach (self::$nestedTransactions as $t) {
								Q::log($t['connections']);
								Q::log($t['backtraces']);
							}
							throw new Exception(
								"forgot to resolve transaction with key $lastTransactionKey"
							);
						}
						array_pop($ntct);
						array_pop($ntbt);
						if (--$ntc == 0) {
							$pdo->commit();
						}
					}
				}
			} catch (Exception $exception) {
				if ($ntc) {
					$pdo->rollBack();
					$ntk = array();
					$ntc = 0;
				}
				break;
			}
			$query->nestedTransactionCount = $ntc;
			if (class_exists('Q') && isset($sql)) {
				// log query if shard split process is active
				// all activities will be done by node.js
				switch ($query->type) {
				case Db_Query::TYPE_SELECT:
					// SELECT queries don't need to be logged
					break;
				default:
					if (!$upcoming or $shardName !== $upcoming['shard']) {
						break;
					}
					$table = $query->table;
					foreach ($query->replacements as $k => $v) {
						$table = str_replace($k, $v, $table);
					}
					if ($table !== $upcoming['dbTable']) break;
					// node will determine new shard(s) names using
					// new sharding config which is available within split process
					$timestamp = $pdo->query("SELECT CURRENT_TIMESTAMP")
						->fetchAll(PDO::FETCH_COLUMN, 0);
					if ($timestamp === false || !isset($timestamp[0])) {
						$timestamp = date("Y-m-d H:i:s"); // backup solution
					} else {
						$timestamp = $timestamp[0];
					}
					$sql_template = str_replace('CURRENT_TIMESTAMP', "'$timestamp'", $sql_template);

					$transaction =
						(!empty($query->clauses['COMMIT']) ? 'COMMIT' :
						(!empty($query->clauses['BEGIN']) ? 'START TRANSACTION' :
						(!empty($query->clauses['ROLLBACK']) ? 'ROLLBACK' : '')));

					$utable = $upcoming['table'];
					if (isset($shards)) {
						$queries = is_string($shards) ? array($shards => $query) : $shards;
					} else {
						$sharded = $query->shard($upcoming['indexes'][$utable]);
					}
					$upcoming_shards = array_keys($sharded);

					$logServer = Q_Config::get('Db', 'internal', 'sharding', 'logServer', null);
					if (!empty($transaction) && $transaction !== 'COMMIT') {
						Q_Utils::sendToNode(array(
							'Q/method' => 'Db/Shards/log',
							'shards' => $upcoming_shards,
							'sql' => "$transaction;"
						), Q_Config::get('Db', 'internal', 'sharding', 'logServer', null));
					}

					Q_Utils::sendToNode(array(
						'Q/method' => 'Db/Shards/log',
						'shards' => $upcoming_shards,
						'sql' => trim(str_replace("\n", ' ', $sql_template))
					), Q_Config::get('Db', 'internal', 'sharding', 'logServer', null));

					if (!empty($transaction) && $transaction === 'COMMIT') {
						Q_Utils::sendToNode(array(
							'Q/method' => 'Db/Shards/log',
							'shards' => $upcoming_shards,
							'sql' => "$transaction;"
						), $logServer, true);
					}
				}
				$query->endedTime = Q::milliseconds(true);
			}
		}
		$this->endedTime = Q::milliseconds(true);
		if (!empty($exception)) {
			/**
			 * @event Db/query/exception {after}
			 * @param {Db_Query_Mysql} query
			 * @param {array} queries
			 * @param {string} sql
			 * @param {Exception} exception
			 */
			Q::event('Db/query/exception', 
				@compact('query', 'queries', 'sql', 'exception'),
				'after'
			);
			if (!class_exists('Q_Exception_DbQuery')) {
				throw new Exception($exception->getMessage() . " [query was: $sql]", -1);
			}
			// See http://php.net/manual/en/class.pdoexception.php#95812
			throw new Q_Exception_DbQuery(array(
				'sql' => $sql,
				'msg' => $exception->getMessage()
			), 'PDOException');
		}
		/**
		 * @event Db/query/execute {after}
		 * @param {Db_Query_Mysql} query
		 * @param {array} queries
		 * @param {string} sql
		 */
		Q::event('Db/query/execute', @compact('query', 'queries', 'sql'), 'after');

		return new Db_Result($stmts, $this);
	}
	
	/**
	 * @method shutdownFunction
	 * @static
	 */
	static function shutdownFunction()
	{
		$connections = 0;
		foreach (self::$nestedTransactions as $nt) {
			if (!empty($nt['count'])) {
				++$connections;
			}
		}
		if ($connections) {
			Q::log("WARNING: Forgot to resolve transactions on $connections connections");
			foreach (self::$nestedTransactions as $t) {
				Q::log($t['connections']);
				Q::log($t['backtraces']);
			}
		}
	}

	/**
	 * Works with SELECT queries to lock the selected rows.
	 * Use only with MySQL.
	 * @method lock
	 * @param {string} [$type='FOR UPDATE'] Defaults to 'FOR UPDATE', but can also be 'LOCK IN SHARE MODE'
	 * @chainable
	 */
	function lock($type = 'FOR UPDATE') {
		switch (strtoupper($type)) {
			case 'FOR UPDATE':
			case 'LOCK IN SHARE MODE':
				$this->clauses['LOCK'] = "$type";
				break;
			default:
				throw new Exception("Incorrect type for MySQL lock");
		}
		return $this;
	}

	/**
	 * Begins a transaction right before executing this query.
	 * The reason this method is part of the query class is because
	 * you often need the "where" clauses to figure out which database to send it to,
	 * if sharding is being used.
	 * @method begin
	 * @param {string|false} [$lockType='FOR UPDATE'] Defaults to 'FOR UPDATE', but can also be 'LOCK IN SHARE MODE'
	 *  or set it to false to avoid adding a "LOCK" clause
	 * @param {string} [$transactionKey=null] Passing a key here makes the system throw an
	 *  exception if the script exits without a corresponding commit by a query with the
	 *  same transactionKey or with "*" as the transactionKey to "resolve" this transaction.
	 * @chainable
	 */
	function begin($lockType = null, $transactionKey = null)
	{
		if (!isset($lockType) or $lockType === true) {
			$lockType = 'FOR UPDATE';
		}
		$this->ignoreCache();
		if ($lockType) {
			$this->lock($lockType);
		}
		if (isset($transactionKey)) {
			$this->transactionKey = $transactionKey;
		}
		$this->clauses["BEGIN"] = "START TRANSACTION";
		return $this;
	}

	/**
	 * Roll back a transaction right after executing this query.
	 * The reason this method is part of the query class is because
	 * you often need the "where" clauses to figure out which database to send it to,
	 * if sharding is being used.
	 * @method rollback
	 * @param {string} [$criteria=null] Pass this to target the rollback to the right shard.
	 * @chainable
	 */
	function rollback($criteria = null)
	{
		if (!empty($this->clauses["BEGIN"])) {
			throw new Exception("You can't use BEGIN and ROLLBACK in the same query.", -1);
		}
		if (!empty($this->clauses["COMMIT"])) {
			throw new Exception("You can't use COMMIT and ROLLBACK in the same query.", -1);
		}
		$this->clauses["ROLLBACK"] = "ROLLBACK";
		if ($criteria) {
			$this->criteria = $criteria;
		}
		return $this;
	}

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
	function commit($transactionKey = null)
	{
		if (!empty($this->clauses["BEGIN"])) {
			throw new Exception("You can't use BEGIN and COMMIT in the same query.", -1);
		}
		if (!empty($this->clauses["ROLLBACK"])) {
			throw new Exception("You can't use COMMIT and ROLLBACK in the same query.", -1);
		}
		$this->ignoreCache();
		$this->clauses["COMMIT"] = "COMMIT";
		if (isset($transactionKey)) {
			$this->transactionKey = $transactionKey;
		}
		return $this;
	}

	/**
	 * Creates a query to select fields from one or more tables.
	 * @method select
	 * @param {string|array} $fields The fields as strings, or array of alias=>field
	 * @param {string|array} [$tables=''] The tables as strings, or array of alias=>table
	 * @param {boolean} [$repeat=false] If $tables is an array, and select() has
	 * already been called with the exact table name and alias
	 * as one of the tables in that array, then
	 * this table is not appended to the tables list if
	 * $repeat is false. Otherwise it is.
	 * This is really just for using in your hooks.
	 * @return {Db_Query_Mysql} The resulting object implementing Db_Query_Interface.
	 * You can use it to chain the calls together.
	 * @throws {Exception} If $tables is specified incorrectly
	 * @chainable
	 */
	function select ($fields, $tables = '', $repeat = false)
	{
		$as = ' '; // was: ' AS ', but now we made it more standard SQL
		if (is_array($fields)) {
			$fields_list = array();
			foreach ($fields as $alias => $column) {
				$fields_list[] = self::column($column) . (is_int($alias) ? '' : "$as$alias");
			}
			$fields = implode(', ', $fields_list);
		}
		if (! is_string($fields)) {
			throw new Exception("The fields to select need to be specified correctly.", -1);
		}

		if (empty($this->clauses['SELECT'])) {
			$this->clauses['SELECT'] = $fields;
		} else {
			$this->clauses['SELECT'] .= ", $fields";
		}

		if ($repeat) {
			$prev_tables_list = explode(',', $this->clauses['FROM']);
		}

		if (! empty($tables)) {
			if (is_array($tables)) {
				$tables_list = array();
				foreach ($tables as $alias => $table) {
					if ($table instanceof Db_Expression) {
						$table_string = is_int($alias) ? "($table)" : "($table) $as $alias";
						$this->parameters = array_merge(
							$this->parameters, $table->parameters
						);
					} else {
						$table_string = is_int($alias) ? "$table" : "$table $as $alias";
					}
					if ($repeat and in_array($table_string, $prev_tables_list)) {
						continue;
					}
					$tables_list[] = $table_string;
				}
				$tables = implode(', ', $tables_list);
			} else if ($tables instanceof Db_Expression) {
				if (isset($tables->parameters)) {
					$this->parameters = array_merge(
						$this->parameters, $tables->parameters
					);
				}
				$tables = $tables->expression;
			}
			if (! is_string($tables)) {
				throw new Exception("The tables to select from need to be specified correctly.", -1);
			}

			if (empty($this->clauses['FROM'])) {
				$this->clauses['FROM'] = $tables;
			} else {
				$this->clauses['FROM'] .= ", $tables";
			}
		}

		return $this;
	}

	/**
	 * Joins another table to use in the query
	 * @method join
	 * @param {string} $table The name of the table. May also be "name alias".
	 * @param {Db_Expression|array|string} $condition The condition to join on. Thus, JOIN table ON ($condition)
	 * @param {string} [$join_type='INNER'] The string to prepend to JOIN, such as 'INNER' (default), 'LEFT OUTER', etc.
	 * @return {Db_Query_Mysql} The resulting object implementing Db_Query_Interface
	 * @throws {Exception} If JOIN clause does not belong to context or condition specified incorrectly
	 * @chainable
	 */
	function join ($table, $condition, $join_type = 'INNER')
	{
		switch ($this->type) {
			case Db_Query::TYPE_SELECT:
			case Db_Query::TYPE_UPDATE:
				break;
			case Db_Query::TYPE_DELETE:
				if (!empty($this->after['FROM']))
					break;
			default:
				throw new Exception("the JOIN clause does not belong in this context.", - 1);
		}

		static $i = 1;
		if (is_array($condition)) {
			$condition_list = array();
			foreach ($condition as $expr => $value) {
				if (is_array($value)) {
					// a bunch of OR criteria
					$pieces = array();
					foreach ($value as $v) {
						foreach ($v as $a => &$b) {
							$v[$a] = new Db_Expression($b);
						}
						$pieces[] = $this->criteria_internal($v);
					}
					$condition_list[] = implode(' OR ', $pieces);
				} else {
					$condition_list[] = $this->criteria_internal(array($expr => new Db_Expression($value)), $criteria);
				}
			}
			$condition = implode(' AND ', $condition_list);
		} else if ($condition instanceof Db_Expression) {
			if (is_array($condition->parameters)) {
				$this->parameters = array_merge(
					$this->parameters, $condition->parameters
				);
			}
			$condition = (string) $condition;
		}
		if (! is_string($condition)) {
			throw new Exception("The JOIN condition needs to be specified correctly.", -1);
		}

		$join = "$join_type JOIN $table ON ($condition)";

		if (empty($this->clauses['JOIN'])) {
			$this->clauses['JOIN'] = $join;
		} else {
			$this->clauses['JOIN'] .= " \n$join";
		}

		return $this;
	}

	/**
	 * Surround the query with "EXISTS()" or "NOT EXISTS()"
	 * to be used as a Db_Expression object
	 * @param {boolean} $shouldExist
	 * @chainable
	 */
	function exists($shouldExist)
	{
		if ($shouldExist) {
			$this->clauses['EXISTS'] = true;
		} else {
			$this->clauses['NOT EXISTS'] = true;
		}
		return $this;
	}

	/**
	 * Adds a WHERE clause to a query
	 * @method where
	 * @param {Db_Expression|array} $criteria An associative array of expression => value pairs.
	 * The values are automatically escaped using the database server, or turned into PDO placeholders for prepared statements
	 * They can also be arrays, in which case they are placed into an expression of the form key IN ('val1', 'val2')
	 * Or, this could be a Db_Expression object.
	 * @return {Db_Query_Mysql} The resulting object implementing Db_Query_Interface
	 * @throws {Exception} If WHERE clause does not belong to context
	 * @chainable
	 */
	function where ($criteria)
	{
		switch ($this->type) {
			case Db_Query::TYPE_SELECT:
			case Db_Query::TYPE_UPDATE:
			case Db_Query::TYPE_DELETE:
				break;
			default:
				throw new Exception("The WHERE clause does not belong in this context.", -1);
		}
		
		if (!isset($criteria)) {
			return $this;
		}

		// and now, for sharding
		if (is_array($criteria)) {
			$this->criteria = $criteria;
		}

		$criteria = $this->criteria_internal($criteria);
		if (! is_string($criteria)) {
			throw new Exception("The WHERE criteria need to be specified correctly.", - 1);
		}

		if (empty($criteria)) {
			return $this;
		}

		if (empty($this->clauses['WHERE'])) {
			$this->clauses['WHERE'] = "$criteria";
		} else {
			$this->clauses['WHERE'] = '(' . $this->clauses['WHERE'] . ") AND ($criteria)";
		}

		return $this;
	}

	/**
	 * Adds to the WHERE clause, like this:   "... AND (x OR y OR z)",
	 * where x, y and z are the arguments to this function.
	 * @method andWhere
	 * @param {array|Db_Expression|string} $criteria An associative array of expression => value pairs.
	 * The values are automatically escaped using the database server, or turned into PDO placeholders
	 * for prepared statements
	 * They can also be arrays, in which case they are placed into an expression of the form "key IN ('val1', 'val2')"
	 * Or, this could be a Db_Expression object.
	 * @param {array|Db_Expression|string} [$or_criteria=null]
	 * @return {Db_Query_Mysql} The resulting object implementing Db_Query_Interface
	 * @throws {Exception} If WHERE clause does not belong to context
	 * @chainable
	 */
	function andWhere ($criteria, $or_criteria = null)
	{
		switch ($this->type) {
			case Db_Query::TYPE_SELECT:
			case Db_Query::TYPE_UPDATE:
			case Db_Query::TYPE_DELETE:
				break;
			default:
				throw new Exception("The WHERE clause does not belong in this context.", -1);
		}
		
		if (!isset($criteria)) {
			return $this;
		}

		if (empty($this->clauses['WHERE'])) {
			throw new Exception("Don't call andWhere() when you haven't called where() yet", -1);
		}

		$args = func_get_args();
		$c_arr = array();
		$was_empty = true;
		foreach ($args as $arg) {
			$c = $this->criteria_internal($arg);
			if (! is_string($c)) {
				throw new Exception("The WHERE criteria need to be specified correctly.", -1);
			}
			$c_arr[] = $c;
			if (!empty($c)) {
				$was_empty = false;
			}
		}

		if ($was_empty) {
			return $this;
		}

		// and now, for sharding
		if ($this->shardIndex() and is_array($criteria)) {
			if (empty($this->criteria)) {
				$this->criteria = $criteria;
			} else {
				if (count($args) > 1) {
					throw new Exception("You can't use OR in your WHERE clause when sharding.");
				}
				$this->criteria = array_merge($this->criteria, $criteria);
			}
		}

		$new_criteria = '('.implode(') OR (', $c_arr).')';
		$this->clauses['WHERE'] = '(' . $this->clauses['WHERE'] . ") AND ($new_criteria)";
		return $this;
	}

	/**
	 * Adds to the WHERE clause, like this:   "... OR (x AND y AND z)",
	 * where x, y and z are the arguments to this function.
	 * @method orWhere
	 * @param {array|Db_Expression|string} $criteria An associative array of expression => value pairs.
	 * The values are automatically escaped using the database server, or turned into PDO placeholders for prepared statements
	 * They can also be arrays, in which case they are placed into an expression of the form key IN ('val1', 'val2')
	 * Or, this could be a Db_Expression object.
	 * @param {array|Db_Expressio|string} [$and_criteria=null]
	 * @return {Db_Query_Mysql} The resulting object implementing Db_Query_Interface
	 * @throws {Exception} If WHERE clause does not belong to context
	 * @chainable
	 */
	function orWhere ($criteria, $and_criteria = null)
	{
		switch ($this->type) {
			case Db_Query::TYPE_SELECT:
			case Db_Query::TYPE_UPDATE:
			case Db_Query::TYPE_DELETE:
				break;
			default:
				throw new Exception("The WHERE clause does not belong in this context.", -1);
		}
		
		if (!isset($criteria)) {
			return $this;
		}

		$args = func_get_args();
		$c_arr = array();
		$was_empty = true;
		foreach ($args as $arg) {
			$c = $this->criteria_internal($arg);
			if (! is_string($c)) {
				throw new Exception("The WHERE criteria need to be specified correctly.", -1);
			}
			if (!empty($c)) {
				$was_empty = false;
			}
			$c_arr[] = $c;
		}
		if ($was_empty) {
			return $this;
		}

		// and now, for sharding
		if ($this->shardIndex() and is_array($criteria) and !empty($this->criteria)) {
			throw new Exception("You can't use OR in your WHERE clause when sharding.");
		}

		$new_criteria = '('.implode(') AND (', $c_arr).')';
		$this->clauses['WHERE'] = '(' . $this->clauses['WHERE'] . ") OR ($new_criteria)";
		return $this;
	}

	/**
	 * This function is specifically for adding criteria to query for sharding purposes.
	 * It doesn't affect the SQL generated for the query.
	 * You can also call this function with an empty set of parameters, to get the current criteria.
	 * @method criteria
	 * @param {array} $criteria An associative array of expression => value pairs.
	 */
	function criteria($criteria = null)
	{
		if (is_array($criteria)) {
			if (empty($this->criteria)) {
				$this->criteria = $criteria;
			} else {
				$this->criteria = array_merge($this->criteria, $criteria);
			}
		}
		return $this->criteria;
	}

	/**
	 * Adds a GROUP BY clause to a query
	 * @method groupBy
	 * @param {Db_Expression|string} $expression
	 * @return {Db_Query_Mysql} The resulting object implementing Db_Query_Interface
	 * @throws {Exception} If GROUP clause does not belong to context
	 * @chainable
	 */
	function groupBy ($expression)
	{
		switch ($this->type) {
			case Db_Query::TYPE_SELECT:
				break;
			default:
				throw new Exception("The GROUP BY clause does not belong in this context.", -1);
		}

		if ($expression instanceof Db_Expression) {
			if (is_array($expression->parameters)) {
				$this->parameters = array_merge(
					$this->parameters, $expression->parameters
				);
			}
			$expression = (string) $expression;
		}
		if (! is_string($expression)) {
			throw new Exception("The GROUP BY expression has to be specified correctly.", -1);
		}

		if (empty($this->clauses['GROUP BY']))
			$this->clauses['GROUP BY'] = "$expression";
		else
			$this->clauses['GROUP BY'] .= ", $expression";
		//if (empty($this->clauses['ORDER BY']))
		//	$this->clauses['ORDER BY'] = "NULL"; // to avoid sorting overhead
		return $this;
	}

	/**
	 * Adds a HAVING clause to a query
	 * @method having
	 * @param {Db_Expression|array} $criteria An associative array of expression => value pairs.
	 * The values are automatically escaped using PDO placeholders. Or, this could be a Db_Expression object.
	 * @return {Db_Query_Mysql} The resulting object implementing Db_Query_Interface
	 * @throws {Exception} If groupBy as not called or criteria is specified incorrectly
	 * @chainable
	 */
	function having ($criteria)
	{
		switch ($this->type) {
			case Db_Query::TYPE_SELECT:
				break;
			default:
				throw new Exception(
					"The HAVING clause does not belong in this context.",
				-1);
		}
		if (empty($this->clauses['GROUP BY'])) {
			throw new Exception("Don't call having() when you haven't called groupBy() yet", -1);
		}

		$criteria = $this->criteria_internal($criteria);
		if (! is_string($criteria)) {
			throw new Exception("The HAVING criteria need to be specified correctly.", - 1);
		}

		if (empty($this->clauses['HAVING']))
			$this->clauses['HAVING'] = "$criteria";
		else
			$this->clauses['HAVING'] = '(' . $this->clauses['HAVING'] . ") AND ($criteria)";

		return $this;
	}


	/**
	 * Adds an ORDER BY clause to the query
	 * @method orderBy
	 * @param {Db_Expression|string} $expression A string or Db_Expression with the expression to order the results by.
	 *  Can also be "random", in which case you are highly encouraged to call ->ignoreCache() as well to get a new random result every time!
	 * @param {boolean} $ascending=true If false, sorts results as descending, otherwise ascending.
	 * @return {Db_Query_Mysql}  The resulting object implementing Db_Query_Interface
	 * @throws {Exception} If ORDER BY clause does not belong to context
	 * @chainable
	 */
	function orderBy ($expression, $ascending = true)
	{
		switch ($this->type) {
			case Db_Query::TYPE_SELECT:
			case Db_Query::TYPE_UPDATE:
				break;
			default:
				throw new Exception("The ORDER BY clause does not belong in this context.",-1);
		}

		if ($expression instanceof Db_Expression) {
			if (is_array($expression->parameters)) {
				$this->parameters = array_merge(
					$this->parameters, $expression->parameters
				);
			}
		}
		$expression = (string) $expression;
		if (! is_string($expression))
			throw new Exception("The ORDER BY expression has to be specified correctly.",-1);

		if (is_string($expression) and (
			strtoupper($expression) === 'RANDOM'
			or strtoupper($expression) === 'RAND()'
		)) {
			$expression = 'RAND()';
		} else if (is_bool($ascending)) {
			$expression .= $ascending ? ' ASC' : ' DESC';
		} else if (is_string($ascending)) {
			if (strtoupper($ascending) == 'ASC') {
				$expression .= ' ASC';
			} else if (strtoupper($ascending) == 'DESC') {
				$expression .= ' DESC';
			}
		}

		if (empty($this->clauses['ORDER BY'])
		or $this->clauses['ORDER BY'] == 'NULL') {
			$this->clauses['ORDER BY'] = "$expression";
		} else {
			$this->clauses['ORDER BY'] .= ", $expression";
		}
		return $this;
	}

	/**
	 * Adds optional LIMIT and OFFSET clauses to the query
	 * @method limit
	 * @param {integer} $limit A non-negative integer showing how many rows to return
	 * @param {integer} [$offset=null] A non-negative integer showing what row to start the result set with.
	 * @param {integer} [$useDeferredJoin=false] If the offset is not empty and this parameter is true, uses the Deferred JOIN technique to massively speed up queries with large offsets. But it only works if the WHERE clause criteria doesn't use joined tables.
	 * @return {Db_Query_Mysql} The resulting object implementing Db_Query_Interface
	 * @throws {Exception} If limit/offset are negative, OFFSET is not alowed in context, LIMIT clause was
	 * specified or clause does not belong to context
	 * @chainable
	 */
	function limit ($limit, $offset = null, $useDeferredJoin = false)
	{
		if (!isset($limit)) {
			return $this;
		}
		if (!is_numeric($limit) or $limit < 0 or floor($limit) != $limit) {
			throw new Exception("the limit must be a non-negative integer");
		}
		if (isset($offset)) {
			if (!is_numeric($offset) or $offset < 0 or floor($offset) != $offset) {
				throw new Exception("the offset must be a non-negative integer");
			}
		}
		switch ($this->type) {
			case Db_Query::TYPE_SELECT:

				break;
			case Db_Query::TYPE_UPDATE:
			case Db_Query::TYPE_DELETE:
				if (isset($offset))
					throw new Exception("the LIMIT clause cannot have an OFFSET in this context");
				break;
			default:
				throw new Exception("The LIMIT clause does not belong in this context.");
		}

		if (! empty($this->clauses['LIMIT']))
			throw new Exception("The LIMIT clause has already been specified.");

		$this->clauses['LIMIT'] = "$limit";
		if (isset($offset)) {
			$this->clauses['LIMIT'] .= " OFFSET $offset";
			$this->useDeferredJoin = $useDeferredJoin;
		}

		return $this;
	}

	/**
	 * Adds a SET clause to an UPDATE statement
	 * @method set
	 * @param {array} $updates An associative array of column => value pairs.
	 * The values are automatically escaped using PDO placeholders.
	 * The value can also be an array of changes, in which case they
	 * would form a CASE WHEN column = {{key}} THEN {{value}}
	 * and if there is a "" key with a corresponding elseValue, 
	 * then it ends with ELSE {{elseValue}}
	 * @return {Db_Query_Mysql} The resulting object implementing Db_Query_Interface
	 * @chainable
	 */
	function set (array $updates)
	{
		$updates = $this->set_internal($updates);

		if (empty($this->clauses['SET'])) {
			$this->clauses['SET'] = $updates;
		} else {
			$this->clauses['SET'] .= ", $updates";
		}
		return $this;
	}

	/**
	 * This function provides an easy way to provide additional clauses to the query.
	 * @method options
	 * @param {array} $options An associative array of key => value pairs, where the key is
	 * the name of the method to call, and the value is the array of arguments.
	 * If the value is not an array, it is wrapped in one.
	 * @chainable
	 */
	function options ($options)
	{
		if (empty($options)) {
			return $this;
		}
		foreach ($options as $key => $value) {
			if ($key !== 'options'
			and is_callable(array($this, $key))) {
				if (!is_array($value)) {
					$value = array($value);
				}
				call_user_func_array(array($this, $key), $value);
			}
		}
		return $this;
	}

	/**
	 * Inserts a custom clause after a particular clause
	 * @method after
	 * @param {string} $after The name of the standard clause to add after, such as FROM or UPDATE
	 * @param {string} $clause The text of the clause to add
	 * @chainable
	 */
	function after($after, $clause)
	{
		if ($clause) {
			$this->after[$after] = isset($this->after[$after])
				? $this->after[$after] . ' ' . $clause
				: $clause;
		}
		return $this;
	}

	/**
	 * Fetches an array of database rows matching the query.
	 * If this exact query has already been executed and
	 * fetchAll() has been called on the Db_Query, and
	 * the return value was cached by the Db_Query class, then
	 * that cached value is returned, unless $this->ignoreCache is true.
	 * Otherwise, the query is executed and fetchAll()
	 * is called on the result.
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
		$fetch_argument = null,
		array $ctor_args = array())
	{
		$conn_name = $this->db->connectionName();

		if (empty($conn_name)) {
			$conn_name = 'empty connection name';
		}
		$sql = $this->getSQL();

		if (isset(Db_Query::$cache[$conn_name][$sql]['fetchAll'])
		and !$this->ignoreCache) {
			return Db_Query::$cache[$conn_name][$sql]['fetchAll'];
		}
		$result = $this->execute();
		$arguments = func_get_args();
		$ret = call_user_func_array(array($result, 'fetchAll'), $arguments);

		if ($this->caching === true
		or ($this->caching === null and !empty($ret))) {
			if (Db::allowCaching()) {
				// cache the result of executing this particular SQL on this db connection
				Db_Query::$cache[$conn_name][$sql]['fetchAll'] = $ret;
			}
		}
		return $ret;
	}

	/**
	 * Fetches an array of database rows matching the query.
	 * If this exact query has already been executed and
	 * fetchAll() has been called on the Db_Query, and
	 * the return value was cached by the Db_Query class, then
	 * that cached value is returned, unless $this->ignoreCache is true.
	 * Otherwise, the query is executed and fetchAll() is called on the result.
	 * @param {string} [$fields_prefix=''] This is the prefix, if any, to strip out when fetching the rows.
	 * @param {string} [$by_field=null] A field name to index the array by.
	 *  If the field's value is NULL in a given row, that row is just appended
	 *  in the usual way to the array.
	 * @return {array}
	 */
	function fetchArray(
		$fields_prefix = '',
		$by_field = null)
	{
		$conn_name = $this->db->connectionName();

		if (empty($conn_name)) {
			$conn_name = 'empty connection name';
		}
		$sql = $this->getSQL();

		if (isset(Db_Query::$cache[$conn_name][$sql]['fetchArray'][$by_field])
		and !$this->ignoreCache) {
			return Db_Query::$cache[$conn_name][$sql]['fetchArray'][$by_field];
		}
		$result = $this->execute();
		$arguments = func_get_args();
		$ret = call_user_func_array(array($result, 'fetchArray'), $arguments);

		if ($this->caching === true
		or ($this->caching === null and !empty($ret))) {
			if (Db::allowCaching()) {
				// cache the result of executing this particular SQL on this db connection
				Db_Query::$cache[$conn_name][$sql]['fetchArray'][$by_field] = $ret;
			}
		}
		return $ret;
	}

	/**
	 * Fetches an array of Db_Row objects (possibly extended).
	 * If this exact query has already been executed and
	 * fetchAll() has been called on the Db_Query, and
	 * the return value was cached by the Db_Query class, then
	 * that cached value is returned.
	 * Otherwise, the query is executed and fetchDbRows() is called on the result.
	 * @method fetchDbRows
	 * @param {string} [$class_name=null]  The name of the class to instantiate and fill objects from.
	 * Must extend Db_Row. Defaults to $this->className
	 * @param {string} [$fields_prefix=''] This is the prefix, if any, to strip out when fetching the rows.
	 * @param {string} [$by_field=null] A field name to index the array by.
	 * If the field's value is NULL in a given row, that row is just appended
	 * in the usual way to the array.
	 * @return {array}
	 */
	function fetchDbRows(
		$class_name = null,
		$fields_prefix = '',
		$by_field = null)
	{
		if (empty($conn_name)) {
			$conn_name = $this->db->connectionName();
		}
		if (empty($conn_name)) {
			$conn_name = 'empty connection name';
		}
		$sql = $this->getSQL();
		$key = $by_field . $fields_prefix;
		if (isset(Db_Query::$cache[$conn_name][$sql]['fetchDbRows'][$key])
		and !$this->ignoreCache) {
			return Db_Query::$cache[$conn_name][$sql]['fetchDbRows'][$key];
		}
		$ret = $this->execute()->fetchDbRows($class_name, $fields_prefix, $by_field);
		if ($this->caching === true
		or ($this->caching === null and !empty($ret))) {
			if (Db::allowCaching()) {
				// cache the result of executing this particular SQL on this db connection
				Db_Query::$cache[$conn_name][$sql]['fetchDbRows'][$key] = $ret;
			}
		}
		return $ret;
	}

	/**
	 * Fetches one Db_Row object (possibly extended).
	 * You can pass a prefix to strip from the field names.
	 * It will also filter the result.
	 * @method fetchDbRow
	 * @param {string} [$class_name=null] The name of the class to instantiate and fill objects from.
	 * Must extend Db_Row. Defaults to $this->query->className
	 * @param {string} [$fields_prefix=''] This is the prefix, if any, to strip out when fetching the rows.
	 * @return {DbRow|boolean} Returns false if no row, otherwise returns an object of type $class_name
	 */
	function fetchDbRow(
		$class_name = null,
		$fields_prefix = '')
	{
		$rows = $this->fetchDbRows($class_name, $fields_prefix);
		if (empty($rows)) {
			return null;
		}
		return reset($rows);
	}

	/**
	 * Adds an ON DUPLICATE KEY UPDATE clause to an INSERT statement.
	 * Use only with MySQL.
	 * @method onDuplicateKeyUpdate
	 * @param {array} $updates An associative array of column => value pairs.
	 * The values are automatically escaped using PDO placeholders.
	 * @return {Db_Query_Mysql} The resulting object implementing Db_Query_Interface
	 * $chainable
	 */
	function onDuplicateKeyUpdate ($updates)
	{
		$updates = $this->onDuplicateKeyUpdate_internal($updates);

		if (empty($this->clauses['ON DUPLICATE KEY UPDATE']))
			$this->clauses['ON DUPLICATE KEY UPDATE'] = $updates;
		else
			$this->clauses['ON DUPLICATE KEY UPDATE'] .= ", $updates";
		return $this;
	}

	/**
	 * Sets context
	 * @method setContext
	 * @param {callable} $callback
	 * @param {array} [$args=array()]
	 */
	function setContext(
		$callback,
		$args = array())
	{
		$this->context = @compact('callback', 'args');
	}

	/**
	 * Can only be called if this is a query returned
	 * from a function that was supposed to execute it, but the user
	 * requested a chance to modify it.
	 * For example, Db_Row->getRelated and Db_Row->retrieve.
	 * After calling a chain of methods, call the resume() method
	 * to complete the original function and return the result.
	 * @method resume
	 */
	function resume()
	{
		if (empty($this->context['callback'])) {
			throw new Exception("Context is empty. Db_Query->resume() can only be called on an intermediate query.", -1);
		}
		$callback = $this->context['callback'];
		if (is_array($callback)) {
			$callback[1] .= '_resume';
		} else {
			$callback .= '_resume';
		}
		$args = empty($this->context['args']) ? array() : $this->context['args'];
		$args[] = $this;
		return call_user_func_array($callback, $args);
	}

	static function column($column)
	{
		$len = strlen($column);
		$part = $column;
		$pos = false;
		for ($i=0; $i<$len; ++$i) {
			$c = $column[$i];
			if ($c !== '.'
			and $c !== '_'
			and $c !== '-'
			and $c !== '$'
			and ($c < 'a' or $c > 'z')
			and ($c < 'A' or $c > 'Z')
			and ($c < '0' or $c > '9')) {
				$pos = $i;
				$part = substr($column, 0, $pos);
				break;
			}
		}
		$parts = explode('.', $part);
		$quoted = array();
		foreach ($parts as $p) {
			$quoted[] = "`$p`";
		}
		return implode('.', $quoted) . ($pos ? substr($column, $pos) : '');
	}

	/**
	 * Re-use an existing (prepared) statement. Rarely used except internally.
	 * @method reuseStatement
	 * @param {Db_Query_Mysql} $query
	 */
	function reuseStatement($query)
	{
		$this->statement = $query->statement;
		return $this;
	}

	/**
	 * Calculates criteria
	 * @method criteria_internal
	 * @private
	 * @param {Db_Expression|array|string} $criteria
	 * @param {array} [&$fillCriteria=null]
	 * @return {string}
	 */
	private function criteria_internal ($criteria, &$fillCriteria = null)
	{
		static $i = 1;
		if (!isset($fillCriteria)) {
			$fillCriteria = $this->criteria;
		}
		if (is_array($criteria)) {
			$criteria_list = array();
			foreach ($criteria as $expr => $value) {
				$parts = explode(',', $expr);
				$parts = array_map('trim', $parts);
				$c = count($parts);
				if ($c > 1) {
					if (!is_array($value)) {
						throw new Exception("Db_Query_Mysql: The value should be an array of arrays");
					}
					$columns = array();
					foreach ($parts as $column) {
						$columns[] = self::column($column);
						if (!empty($fillCriteria[$column])) {
							$fillCriteria[$column] = array(); // sharding heuristics
						}
					}
					$list = array();
					foreach ($value as $arr) {
						if (!is_array($arr)) {
							$json = json_encode($arr);
							throw new Exception("Db.Query.Mysql: Value $json needs to be an array");
						}
						if (count($arr) != $c) {
							throw new Exception(
								"Db_Query_Mysql: Arrays should have $c elements to match $expr"
							);
						}
						$vector = array();
						foreach ($arr as $v) {
							$vector[] = ":_where_$i";
							$this->parameters["_where_$i"] = $v;
							++ $i;
							$fillCriteria[$column][] = $v; // sharding heuristics
						}
						$list[] = '(' .  implode(',', $vector) . ')';
					}
					if (!empty($list)) {
						$lhs = '(' . implode(',', $columns) . ')';
						$rhs = "(\n" . implode(',', $list) . "\n)";
						$criteria_list[] = "$lhs IN $rhs";
					} else {
						$criteria_list[] = "FALSE";
					}
				} else if ($value === null) {
					$criteria_list[] = "ISNULL($expr)";
				} else if ($value instanceof Db_Expression) {
					if (is_array($value->parameters)) {
						$this->parameters = array_merge(
							$this->parameters, $value->parameters
						);
					}
					$criteria_list[] = preg_match('/\W/', substr($expr, -1))
						? "$expr ($value)"
						: self::column($expr)." = ($value)";
				} else if (is_array($value)) {
					if (!empty($value)) {
						$value = array_unique($value);
						$values = array();
						foreach ($value as $v) {
							$values[] = ":_where_$i";
							$this->parameters["_where_$i"] = $v;
							++ $i;
						}
						$value_list = implode(',', $values);
					}
					if (preg_match('/\W/', substr($expr, -1))) {
						$criteria_list[] = "$expr ($value_list)";
					} else if (empty($value)) {
						$criteria_list[] = "FALSE"; // since $value list is empty
					} else {
						$criteria_list[] = self::column($expr) . " IN ($value_list)";
					}
				} else if ($value instanceof Db_Range) {
					if (isset($value->min)) {
						$c_min = $value->includeMin ? '>=' : '>';
						$criteria_list[] = self::column($expr) . " $c_min :_where_$i";
						$this->parameters["_where_$i"] = $value->min;
						++ $i;
					}
					if (isset($value->max)) {
						$c_max = $value->includeMax ? '<=' : '<';
						$criteria_list[] = self::column($expr) . " $c_max :_where_$i";
						$this->parameters["_where_$i"] = $value->max;
						++ $i;
					}
				} else {
					$eq = preg_match('/\W/', substr($expr, -1)) ? '' : ' = ';
					$criteria_list[] = self::column($expr) . "$eq:_where_$i";
					$this->parameters["_where_$i"] = $value;
					++ $i;
				}
			}
			$criteria = implode(' AND ', $criteria_list);
		} else if ($criteria instanceof Db_Expression) {
			/* @var $criteria Db_Expression */
			if (is_array($criteria->parameters)) {
				$this->parameters = array_merge($this->parameters, $criteria->parameters);
			}
			$criteria = (string) $criteria;
		}

		return $criteria;
	}

	/**
	 * Calculates SET clause
	 * @method set_internal
	 * @private
	 * @param {array} $updates An associative array of column => value pairs.
	 * The values are automatically escaped using PDO placeholders.
	 * @return {string}
	 */
	private function set_internal ($updates)
	{
		switch ($this->type) {
			case Db_Query::TYPE_UPDATE:
				break;
			default:
				throw new Exception("The SET clause does not belong in this context.", - 1);
		}

		static $i = 1;
		if (is_array($updates)) {
			$updates_list = array();
			foreach ($updates as $field => $value) {
				$column = self::column($field);
				if ($value instanceof Db_Expression) {
					if (is_array($value->parameters)) {
						$this->parameters = array_merge($this->parameters, $value->parameters);
					}
					$updates_list[] = "$column = $value";
				} else if (is_array($value)) {
					$cases = "$column = (CASE";
					foreach ($value as $k => $v) {
						if (!$k) {
							continue;
						}
						$cases .= "\n\tWHEN $column = :_set_$i THEN :_set_".($i+1);
						$this->parameters["_set_$i"] = $k;
						$this->parameters["_set_".($i+1)] = $v;
						$i += 2;
					}
					if (isset($value[''])) {
						$cases .= "\n\tELSE :_set_$i";
						$this->parameters["_set_$i"] = $k;
					} else {
						$cases .= "\n\tELSE ''";
					}
					++$i;
					$cases .= "\nEND)";
					$updates_list[] = $cases;
				} else {
					$updates_list[] = "$column = :_set_$i";
					$this->parameters["_set_$i"] = $value;
					++ $i;
				}
			}
			if (count($updates_list) > 0)
				$updates = implode(", \n", $updates_list);
			else
				$updates = '';
		}
		if (! is_string($updates)) {
			throw new Exception("The SET updates need to be specified correctly.", - 1);
		}

		return $updates;
	}

	/**
	 * Calculates an ON DUPLICATE KEY UPDATE clause
	 * @method onDuplicateKeyUpdate_internal
	 * @private
	 * @param {array} $updates An associative array of column => value pairs.
	 * The values are automatically escaped using PDO placeholders.
	 * @return {string}
	 */
	private function onDuplicateKeyUpdate_internal ($updates)
	{
		if ($this->type != Db_Query::TYPE_INSERT) {
			throw new Exception("The ON DUPLICATE KEY UPDATE clause does not belong in this context.", -1);
		}

		static $i = 1;
		if (is_array($updates)) {
			$updates_list = array();
			foreach ($updates as $field => $value) {
				if ($value instanceof Db_Expression) {
					if (is_array($value->parameters)) {
						$this->parameters = array_merge($this->parameters,
							$value->parameters);
					}
					$updates_list[] = self::column($field) . " = $value";
				} else {
					$updates_list[] = self::column($field) . " = :_dupUpd_$i";
					$this->parameters["_dupUpd_$i"] = $value;
					++ $i;
				}
			}
			$updates = implode(", ", $updates_list);
		}
		if (! is_string($updates))
			throw new Exception("The ON DUPLICATE KEY updates need to be specified correctly.", -1);

		return $updates;
	}

	/**
	 * Connects to database
	 * @method reallyConnect
	 * @private
	 * @param {string} [$shardName=null]
	 * @return {PDO} The PDO object for connection
	 */
	private function reallyConnect($shardName = null, &$shardInfo = null)
	{
		/**
		 * @event Db/reallyConnect {before}
		 * @param {Db_Query_Mysql} query
		 * @param {string} 'shardName'
		 */
		Q::event(
			'Db/query/route',
			array('query' => $this, 'shardName' => $shardName),
			'before'
		);
		return $this->db->reallyConnect($shardName, $shardInfo);
	}
	
	public $startedTime = null;
	public $endedTime = null;
	public $useDeferredJoin = false;
	protected $transactionKey = null;

	protected static $nestedTransactions = array();
}
