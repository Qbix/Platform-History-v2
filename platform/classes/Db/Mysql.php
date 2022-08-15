<?php

/**
 * @module Db
 */

class Db_Mysql implements Db_Interface
{
	/**
	 * This class lets you create and use PDO database connections.
	 * @class Db_Mysql
	 * @extends Db_Interface
	 * @constructor
	 *
	 * @param {string} $connectionName The name of the connection out of the connections added with Db::setConnection()
	 * This is required for actually connecting to the database.
	 * @param {PDO} [$pdo=null] Existing PDO connection. Only accepts connections to MySQL.
	 */
	function __construct ($connectionName, PDO $pdo = null)
	{
		$this->connectionName = $connectionName;
		if ($pdo) {
			// The following statement may throw an exception, which is fine.
			$driver_name = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
			if (strtolower($driver_name) != 'mysql')
				throw new Exception("the PDO object is not for mysql", -1);

			$this->pdo = $pdo;
		}
	}

	/**
	 * The PDO connection that this object uses
	 * @property $pdo
	 * @type PDO
	 */
	public $pdo;

	/**
	 * The shard info after calling reallyConnect
	 * @property $shardInfo
	 * @type array
	 */
	public $shardInfo;
	
	/**
	 * The name of the connection
	 * @property $connectionName
	 * @type string
	 * @protected
	 */
	protected $connectionName;
	
	/**
	 * The name of the shard currently selected with reallyConnect, if any
	 * @property $shardName
	 * @type string
	 * @protected
	 */
	protected $shardName;

	/**
	 * The database name of the shard currently selected with reallyConnect, if any
	 * @property $dbname
	 * @type string
	 */
	public $dbname;

	/**
	 * The prefix of the shard currently selected with reallyConnect, if any
	 * @property $prefix
	 * @type string
	 */
	public $prefix;

	/**
	 * The cutoff after which strlen gets too expensive to check automatically
	 * @property $maxCheckStrlen
	 * @type string
	 */
	public $maxCheckStrlen = 1000000;

	/**
	 * Actually makes a connection to the database (by creating a PDO instance)
	 * @method reallyConnect
	 * @param {array} [$shardName=null] A shard name that was added using Db::setShard.
	 * This modifies how we connect to the database.
	 * @return {PDO} The PDO object for connection
	 */
	function reallyConnect($shardName = null, &$shardInfo = null)
	{
		if ($this->pdo) {
			$shardInfo = $this->shardInfo;
			return $this->pdo;
		}
		$connectionName = $this->connectionName;
		$connectionInfo = Db::getConnection($connectionName);
		if (empty($connectionInfo)) {
			throw new Exception("database connection \"$connectionName\" wasn't registered with Db.", -1);
		}
		
		if (empty($shardName)) {
			$shardName = '';
		}
		$modifications = Db::getShard($connectionName, $shardName);
		if (!isset($modifications)) {
			$modifications = array();
		}
		if (class_exists('Q')) {
			/**
			 * Occurs before a real connection to the database is made
			 * @event Db/reallyConnect {before}
			 * @param {Db_Mysql} db
			 * @param {string} shardName
			 * @param {array} modifications
			 * @return {array}
			 *	Extra modifications
			 */
			$more = Q::event('Db/reallyConnect', array(
				'db' => $this,
				'shardName' => $shardName,
				'modifications' => $modifications
			), 'before');
			if ($more) {
				$modifications = array_merge($modifications, $more);
			}
		}
		
		$dsn = isset($modifications['dsn']) ? $modifications['dsn'] : $connectionInfo['dsn'];
		$prefix = isset($modifications['prefix']) ? $modifications['prefix'] : $connectionInfo['prefix'];
		$username = isset($modifications['username']) ? $modifications['username'] : $connectionInfo['username'];
		$password = isset($modifications['password']) ? $modifications['password'] : $connectionInfo['password'];
		$driver_options = isset($modifications['driver_options']) 
			? $modifications['driver_options'] 
			: (isset($connectionInfo['driver_options']) ? $connectionInfo['driver_options'] : null);

		$this->shardInfo = $shardInfo = compact('dsn', 'prefix', 'username', 'password', 'driver_options');

		// More dsn changes
		$dsn_fields = array();
		foreach (array('host', 'port', 'dbname', 'unix_socket', 'charset') as $f) {
			if (isset($modifications[$f])) {
				$dsn_fields[$f] = $modifications[$f];
			}
		}
		if ($dsn_fields) {
			$dsn_array = array_merge(Db::parseDsnString($dsn), $dsn_fields);
			$dsn = 'mysql:'.http_build_query($dsn_array, '', ';');
		} else {
			$dsn_array = Db::parseDsnString($dsn);
		}

		// The connection may have already been made with these parameters,
		// in which case we will just retrieve the existing connection.
		$this->pdo = Db::pdo($dsn, $username, $password, $driver_options, $connectionName, $shardName);
		$this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		$this->shardName = $shardName;
		$this->dbname = $dsn_array['dbname'];
		$this->prefix = $prefix;

		if (class_exists('Q')) {
			/**
			 * Occurs when a real connection to the database has been made
			 * @event Db/reallyConnect {after}
			 * @param {Db_Mysql} db
			 * @param {string} shardName
			 * @param {array} modifications
			 */
			Q::event('Db/reallyConnect', array(
				'db' => $this,
				'shardName' => $shardName,
				'modifications' => $modifications
			), 'after');
		}
		$this->pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
		$this->pdo->setAttribute(PDO::MYSQL_ATTR_USE_BUFFERED_QUERY, true);
		$this->setTimezone();
		return $this->pdo;
	}
	
	/**
	 * Sets the timezone in the database to match the one in PHP
	 * @param {integer} [$offset=timezone_offset_get()] in seconds
	 * @method setTimezone
	 */
	function setTimezone($offset = null)
	{
		if (!isset($offset)) {
			$offset = (int)date('Z');
		}
		if (!$offset) {
			$offset = 0;
		}
		$abs = abs($offset);
		$hours = sprintf("%02d", floor($abs / 3600));
		$minutes = sprintf("%02d", floor(($abs % 3600) / 60));
		$sign = ($offset > 0) ? '+' : '-';
		$this->rawQuery("SET time_zone = '$sign$hours:$minutes';")->execute();
	}
	
	/**
	 * Returns the name of the shard currently selected with reallyConnect, if any
	 * @method shardName
	 * @return {string}
	 */
	function shardName()
	{
		return $this->shardName;
	}

	/**
	 * Forwards all other calls to the PDO object
	 * @method __call
	 * @param {string} $name The function name
	 * @param {array} $arguments The arguments
	 * @return {mixed} The result of method call
	 */
	function __call ($name, array $arguments)
	{
		$this->reallyConnect();
		if (!is_callable(array($this->pdo, $name))) {
			throw new Exception("neither Db_Mysql nor PDO supports the $name function");
		}
		return call_user_func_array(array($this->pdo, $name), $arguments);
	}

	/**
	 * Returns the name of the connection with which this Db object was created.
	 * @method connectionName
	 * @return {string}
	 */
	function connectionName ()
	{
		return isset($this->connectionName) ?  $this->connectionName : null;
	}
	
	/**
	 * Returns the connection info with which this Db object was created.
	 * @method connection
	 * @return {string}
	 */
	function connection()
	{
		if (isset($this->connectionName)) {
			return Db::getConnection($this->connectionName);
		}
		return null;
	}
	
	/**
	 * Returns an associative array representing the dsn
	 * @method dsn
	 * @return {array}
	 */
	function dsn()
	{
		$connectionInfo = Db::getConnection($this->connectionName);
		if (empty($connectionInfo['dsn'])) {
			throw new Exception(
				'No dsn string found for the connection ' 
				. $this->connectionName
			);
		}
		return Db::parseDsnString($connectionInfo['dsn']);
	}
	
	/**
	 * Returns the lowercase name of the dbms (e.g. "mysql")
	 * @method dbms
	 * @return {string}
	 */
	function dbms()
	{
		return 'mysql';
	}
	
	/**
	 * Returns the name of the database used
	 * @method dbName
	 * @return {string}
	 */
	function dbName()
	{
		$dsn = $this->dsn();
		if (empty($dsn))
			return null;
		return $dsn['dbname'];
	}

	/**
	 * Creates a query to select fields from a table. Needs to be used with Db_Query::from().
	 * @method select
	 * @param {string|array} [$fields='*'] The fields as strings, or "*", or array of alias=>field
	 * @param {string|array} [$tables=''] The tables as strings, or array of alias=>table
	 * @return {Db_Query_Mysql} The resulting Db_Query object
	 */
	function select ($fields = '*', $tables = '')
	{
		if (empty($fields))
			throw new Exception("fields not specified in call to 'select'.");
		if (!isset($tables))
			throw new Exception("tables not specified in call to 'select'.");
		$query = new Db_Query_Mysql($this, Db_Query::TYPE_SELECT);
		return $query->select($fields, $tables);
	}

	/**
	 * Creates a query to insert a row into a table
	 * @method insert
	 * @param {string} $table_into The name of the table to insert into
	 * @param {array} $fields=array() The fields as an array of column=>value pairs
	 * @return {Db_Query_Mysql} The resulting Db_Query_Mysql object
	 */
	function insert ($table_into, array $fields = array())
	{
		if (empty($table_into))
			throw new Exception("table not specified in call to 'insert'.");
		
		// $fields might be an empty array,
		// but the insert will still be attempted.
		
		$columnsList = array();
		$valuesList = array();
		foreach ($fields as $column => $value) {
			$columnsList[] = Db_Query_Mysql::column($column);
			if ($value instanceof Db_Expression) {
				$valuesList[] = "$value";
			} else {
				$valuesList[] = ":$column";
			}
		}
		$columnsString = implode(', ', $columnsList);
		$valuesString = implode(', ', $valuesList);
		
		$clauses = array(
			'INTO' => "$table_into ($columnsString)", 'VALUES' => $valuesString
		);
		
		return new Db_Query_Mysql($this, Db_Query::TYPE_INSERT, $clauses, $fields, $table_into);
	}

	/**
	 * Inserts multiple rows into a single table, preparing the statement only once,
	 * and executes all the queries.
	 * @method insertManyAndExecute
	 * @param {string} $table_into The name of the table to insert into
	 * @param {array} [$rows=array()] The array of rows to insert. 
	 * Each row should be an array of ($field => $value) pairs, with the exact
	 * same set of keys (field names) in each array. It can also be a Db_Row.
	 * @param {array} [$options=array()] An associative array of options, including:
	 * @param {array} [$options.columns] Pass an array of column names, otherwise
	 *    they are automatically taken from the first row being inserted.
	 * @param {string} [$options.className]
	 *    If you provide the class name, the system will be able to use any sharding
	 *    indexes under that class name in the config.
	 * @param {integer} [$options.chunkSize]
	 *    The number of rows to insert at a time. Defaults to 20.
	 *    You can also put 0 here, which means unlimited chunks, but it's not recommended.
	 * @param {array} [$options.onDuplicateKeyUpdate]
	 *    You can put an array of fieldname => value pairs here,
	 *    which will add an ON DUPLICATE KEY UPDATE clause to the query.
	 */
	function insertManyAndExecute ($table_into, array $rows = array(), $options = array())
	{
		// Validate and get options
		if (empty($table_into)) {
			throw new Exception("table not specified in call to 'insertManyAndExecute'.");
		}
		if (empty($rows)) {
			return false;
		}
		$chunkSize = isset($options['chunkSize']) ? $options['chunkSize'] : 20;
		if ($chunkSize < 0) {
			return false;
		}
		$onDuplicateKeyUpdate = isset($options['onDuplicateKeyUpdate'])
				? $options['onDuplicateKeyUpdate'] : null;
		$className = isset($options['className']) ? $options['className'] : null;
		
		// Get the columns list
		$rawColumns = array();
		if (isset($options['columns'])) {
			$columnsList = $options['columns'];
			foreach ($columnsList as $c) {
				$rawColumns[$c] = $c;
			}
		} else {
			$row = reset($rows);
			$record = ($row instanceof Db_Row) ? $row->fields : $row;
			foreach ($record as $column => $value) {
				$columnsList[] = $c = Db_Query_Mysql::column($column);
				$rawColumns[$c] = $column;
			}
		}
		$columnsString = implode(', ', $columnsList);
		$into = "$table_into ($columnsString)";
		
		// On duplicate key update clause (optional)
		$update_fields = array();
		$odku_clause = '';
		if (isset($onDuplicateKeyUpdate)) {
			$odku_clause = "\n\t ON DUPLICATE KEY UPDATE ";
			$parts = array();
			foreach ($onDuplicateKeyUpdate as $k => $v) {
				if ($v instanceof Db_Expression) {
					$part = "= $v";
				} else {
					$part = " = :__update_$k";
					$update_fields["__update_$k"] = $v;
				}
				$parts[] .= Db_Query_Mysql::column($k) . $part;
			}
			$odku_clause .= implode(",\n\t", $parts);
		}
		
		// Start filling
		$queries = array();
		$queryCounts = array();
		$bindings = array();
		$last_q = array();
		$last_queries = array();
		foreach ($rows as $row) {
			if ($row instanceof Db_Row) {
				if (class_exists('Q') and class_exists($className)) {
					Q::event("Db/Row/$className/save", array(
						'row' => $row
					), 'before'); 
				}
				$callback = array($row, "beforeSave");
				if (is_callable($callback)) {
					call_user_func(
						$callback, $row->fields, false, false
					);
				}
				$fieldNames = method_exists($row, 'fieldNames')
					? $row->fieldNames()
					: null;
				$record = array();
				if (is_array($fieldNames)) {
					foreach ($fieldNames as $name) {
						$record[$name] = $row->fields[$name];
					}
				} else {
					foreach ($row->fields as $name => $value) {
						$record[$name] = $value;
					}
				}
			} else {
				$record = $row;
			}
			$query = new Db_Query_Mysql($this, Db_Query::TYPE_INSERT);
			// get shard, if any
			$shard = '';
			if (isset($className)) {
				$query->className = $className;
				$sharded = $query->shard(null, $record);
				if (count($sharded) > 1 or $shard === '*') { // should be only one shard
					throw new Exception("Db_Mysql::insertManyAndExecute row should be stored on exactly one shard: " . Q::json_encode($record));
				}
				$shard = key($sharded);
			}
			
			// start filling out the query data
			$qc = empty($queryCounts[$shard]) ? 1 : $queryCounts[$shard] + 1;
			if (!isset($bindings[$shard])) {
				$bindings[$shard] = array();
			}
			$valuesList = array();
			$index = 0;
			foreach ($columnsList as $column) {
				++$index;
				$raw = $rawColumns[$column];
				$value = isset($record[$raw]) ? $record[$raw] : null;
				if ($value instanceof Db_Expression) {
					$valuesList[] = "$value";
				} else {
					$valuesList[] = ':_'.$qc.'_'.$index;
					$bindings[$shard]['_'.$qc.'_'.$index] = $value;
				}
			}
			$valuesString = implode(', ', $valuesList);
			if (empty($queryCounts[$shard])) {
				$q = $queries[$shard] = "INSERT INTO $into\nVALUES ($valuesString) ";
				$queryCounts[$shard] = 1;
			} else {
				$q = $queries[$shard] .= ",\n       ($valuesString) ";
				++$queryCounts[$shard];
			}

			// if chunk filled up for this shard, execute it
			if ($qc === $chunkSize) {
				if ($onDuplicateKeyUpdate) {
					$q .= $odku_clause;
				}
				$query = $this->rawQuery($q)->bind($bindings[$shard]);
				if ($onDuplicateKeyUpdate) {
					$query = $query->bind($update_fields);
				}
				if (isset($last_q[$shard]) and $last_q[$shard] === $q) {
					// re-use the prepared statement, save round-trips to the db
					$query->reuseStatement($last_queries[$shard]);
				}
				$query->execute(true, $shard);
				$last_q[$shard] = $q;
				$last_queries[$shard] = $query; // save for re-use
				$bindings[$shard] = $queries[$shard] = array();
				$queryCounts[$shard] = 0;
			}
		}
		
		// Now execute the remaining queries, if any
		foreach ($queries as $shard => $q) {
			if (!$q) continue;
			if ($onDuplicateKeyUpdate) {
				$q .= $odku_clause;
			}
			$query = $this->rawQuery($q)->bind($bindings[$shard]);
			if ($onDuplicateKeyUpdate) {
				$query = $query->bind($update_fields);
			}
			if (isset($last_q[$shard]) and $last_q[$shard] === $q) {
				// re-use the prepared statement, save round-trips to the db
				$query->reuseStatement($last_queries[$shard]);
			}
			$query->execute(true, $shard);
		}
		
		foreach ($rows as $row) {
			if ($row instanceof Db_Row) {
				$row->wasInserted(true);
				$row->wasRetrieved(true);
			}
		}
	}

	/**
	 * Creates a query to update rows. Needs to be used with {@link Db_Query::set}
	 * @method update
	 * @param {string} $table The table to update
	 * @return {Db_Query_Mysql} The resulting Db_Query object
	 */
	function update ($table)
	{		
		if (empty($table))
			throw new Exception("table not specified in call to 'update'.");
		
		$clauses = array('UPDATE' => "$table");
		return new Db_Query_Mysql($this, Db_Query::TYPE_UPDATE, $clauses, array(), $table);
	}

	/**
	 * Creates a query to delete rows.
	 * @method delete
	 * @param {string} $table_from The table to delete from
	 * @param {string} [$table_using=null] If set, adds a USING clause with this table. You can then use ->join() with the resulting Db_Query.
	 * @return {Db_Query_Mysql}
	 */
	function delete ($table_from, $table_using = null)
	{	
		if (empty($table_from))
			throw new Exception("table not specified in call to 'delete'.");

		if (isset($table_using) and !is_string($table_using)) {
			throw new Exception("table_using field must be a string");
		}

		if (isset($table_using))
			$clauses = array('FROM' => "$table_from USING $table_using");
		else
			$clauses = array('FROM' => "$table_from");
		return new Db_Query_Mysql($this, Db_Query::TYPE_DELETE, $clauses, array(), $table_from);
	}

	/**
	 * Creates a query from raw SQL
	 * @method rawQuery
	 * @param {string|null} $sql May contain one or more SQL statements.
	 *  Pass null here for an empty query that you can add other clauses to, e.g. ->commit().
	 * @param {array} [$bind=array()] An array of parameters to bind to the query, using
	 * the Db_Query_Mysql->bind method. They are used to replace foo=:foo and bar=?
	 * @return {Db_Query_Mysql}
	 */
	function rawQuery ($sql = null, $bind = array())
	{
		$clauses = array('RAW' => $sql);
		$query = new Db_Query_Mysql($this, Db_Query::TYPE_RAW, $clauses);
		if ($bind) {
			$query->bind($bind);
		}
		return $query;
	}
	
	/**
	 * Creates a query to rollback a previously started transaction.
	 * @method update
	 * @param {array} $criteria The criteria to use, for sharding
	 * @return {Db_Query_Mysql} The resulting Db_Query object
	 */
	function rollback ($criteria = null)
	{
		$query = new Db_Query_Mysql($this, Db_Query::TYPE_ROLLBACK, array('ROLLBACK' => true));
		$query->rollback($criteria);
		return $query;
	}

    /**
     * Sorts a table in chunks
     * @method rank
     * @param {string} $table The name of the table in the database
     * @param {string} $pts_field The name of the field to rank by.
     * @param {string} $rank_field The rank field to update in all the rows
     * @param {integer} [$start=1] The value of the first rank
     * @param {integer} [$chunk_size=1000] The number of rows to process at a time. Default is 1000.
     * This is so the queries don't tie up the database server for very long,
     * letting it service website requests and other things.
     * @param {integer} [$rank_level2=0] Since the ranking is done in chunks, the function must know
     *  which rows have not been processed yet. If this field is empty (default)
     *  then the function sets the rank_field to 0 in all the rows, before
     *  starting the ranking process.
     *  (That might be a time consuming operation.)
     *  Otherwise, if $rank is a nonzero integer, then the function alternates
     *  between the ranges
     *  $start to $rank_level2, and $rank_level2 + $start to $rank_level2 * 2.
     *  That is, after it is finished, all the ratings will be in one of these
     *  two ranges.
     *  If not empty, this should be a very large number, like a billion.
     * @param {array} [$order_by] The order clause to use when calculating ranks.
     *  Default is array($pts_field, false)
     * @param {array} [$where=null] Any additional criteria to filter the table by.
	 *  The ranking algorithm will do its work within the results that match this criteria.
	 *  If your table is sharded, then all the work must be done within one shard.
     */
    function rank(
        $table,
        $pts_field, 
        $rank_field, 
		$start = 1,
        $chunk_size = 1000, 
        $rank_level2 = 0,
        $order_by = null,
		$where = array())
    {	
		if (!isset($order_by)) {
			$order_by = array($pts_field, false);
		}		
		if (!isset($where)) {
			$where = '1';
		}
        
        // Count all the rows
        $query = $this->select('COUNT(1) _count', $table)->where($where);
        $sharded = $query->shard();
	    $shard = key($sharded);
        if (count($sharded) > 1 or $shard === '*') { // should be only one shard
        	throw new Exception("Db_Mysql::rank can work within at most one shard");
        }
        $row = $query->execute()->fetch(PDO::FETCH_ASSOC);
        $count = $row['_count'];
		
        if (empty($rank_level2)) {
            $this->update($table)
                ->set(array($rank_field => 0))
				->where($where)
                ->execute();
            $rank_base = 0;
            $condition = "$rank_field = 0 OR $rank_field IS NULL";
        } else {
            $rows = $this->select($pts_field, $table)
                ->where("$rank_field < $rank_level2")
				->andWhere($where)
                ->limit(1)
                ->fetchAll();
            if (!empty($rows)) {
        		// There are no ranks above $rank_level2. Create ranks on level 2.
        		$rank_base = $rank_level2;
        		$condition = "$rank_field < $rank_level2";
        	} else {
        		// The ranks are all above $rank_level2. Create ranks on level 1.
        		$rank_base = 0;
        		$condition = "$rank_field >= $rank_level2";
        	}
        }
    	
        // Here comes the magic:
		$offset = 0;
		$rank_base += $start;
		$this->rawQuery("set @rank = $offset - 1")->execute(false, $shard);
        do {
			$query = $this->update($table)->set(array(
				$rank_field => new Db_Expression("$rank_base + (@rank := @rank + 1)")
			))->where($condition);
			if ($where) {
				$query = $query->andWhere($where);
			}
			if ($order_by) {
				$query = call_user_func_array(array($query, 'orderBy'), $order_by);
			}
			$query->limit($chunk_size)->execute();
			$offset += $chunk_size;
        } while ($count-$offset > 0);
    }

	/**
	 * Generate an ID that is unique in a table
	 * @method uniqueId
	 * @param {string} $table The name of the table
	 * @param {string} $field The name of the field to check for uniqueness.
	 *  You should probably have an index starting with this field.
	 * @param {array} [$where=array()] You can indicate conditions here to limit the search for
	 *  an existing value. The result is an id that is unique within a certain partition.
	 * @param {array} [$options=array()] Optional array used to override default options:
	 * @param {integer} [$options.length=8] The length of the ID to generate, after the prefix.
	 * @param {string} [$options.characters='abcdefghijklmnopqrstuvwxyz']  All the characters from which to construct the id
	 * @param {string} [$options.prefix=''] The prefix to prepend to the unique id.
	 * @param {callable} [$options.filter]
	 *     The name of a function that will take the generated string and
	 *     check it. The filter function can modify the string by returning another string,
	 *     or simply reject the string by returning false, in which another string will be
	 */
	function uniqueId(
		$table, 
		$field, 
		$where = array(),
		$options = array())
	{
		$length = 8;
		$characters = 'abcdefghijklmnopqrstuvwxyz';
		$prefix = '';
		extract($options);
		$count = strlen($characters);
		do {
			$id = $prefix;
			for ($i=0; $i<$length; ++$i) {
				$id .= $characters[mt_rand(0, $count-1)];
			}
			if (!empty($options['filter'])) {
				$ret = Q::call($options['filter'], array(@compact('id', 'table', 'field', 'where', 'options')));
				if ($ret === false) {
					continue;
				} else if ($ret) {
					$id = $ret;
				}
			}
			$q = $this->select($field, $table)
				->where(array($field => $id));
			if ($where) {
				$q->andWhere($where);
			}
			$rows = $q->limit(1)->fetchAll();
		} while ($rows);
		return $id;
	}

	/**
	 * Returns a timestamp from a Date string
	 * @method fromDate
	 * @param {string} $datetime The Date string that comes from the db
	 * @return {integer} The timestamp
	 */
	function fromDate ($date)
	{
		$year = (int)substr($date, 0, 4);
		$month = (int)substr($date, 5, 2);
		$day = (int)substr($date, 8, 2);

		return mktime(0, 0, 0, $month, $day, $year);
	}
    
	/**
	 * Returns a timestamp from a DateTime string
	 * @method fromDateTime
	 * @param {string} $datetime The DateTime string that comes from the db
	 * @return {integer} The timestamp
	 */
	function fromDateTime ($datetime)
	{
		if (is_numeric($datetime)) {
			return $datetime;
		}
		$year = (int)substr($datetime, 0, 4);
		$month = (int)substr($datetime, 5, 2);
		$day = (int)substr($datetime, 8, 2);
		$hour = (int)substr($datetime, 11, 2);
		$min = (int)substr($datetime, 14, 2);
		$sec = (int)substr($datetime, 17, 2);

		return mktime($hour, $min, $sec, $month, $day, $year);
	}

	/**
	 * Returns a Date string to store in the database
	 * @method toDate
	 * @param {string} $timestamp The UNIX timestamp, e.g. from a strtotime function
	 * @return {string}
	 */
	function toDate ($timestamp)
	{
		if (!is_numeric($timestamp)) {
			$timestamp = strtotime($timestamp);
		}
		if ($timestamp > 10000000000) {
			$timestamp = $timestamp / 1000;
		}
		return date('Y-m-d', $timestamp);
	}

	/**
	 * Returns a DateTime string to store in the database
	 * @method toDateTime
	 * @param {string} $timestamp The UNIX timestamp, e.g. from a strtotime function
	 * @return {string}
	 */
	function toDateTime ($timestamp)
	{
		if (!is_numeric($timestamp)) {
			$timestamp = strtotime($timestamp);
		}
		if ($timestamp > 10000000000) {
			$timestamp = $timestamp / 1000;
		}
		return date('Y-m-d H:i:s', $timestamp);
	}
	
	/**
	 * Returns the timestamp the db server would have, based on synchronization
	 * @method timestamp
	 * @return {integer}
	 */
	function getCurrentTimestamp()
	{
		static $dbtime = null, $phptime = null;
		if (!isset($dbtime)) {
			$phptime1 = time();
			$row = $this->select('CURRENT_TIMESTAMP', '')
				->execute()
				->fetch(PDO::FETCH_NUM);
			$dbtime = $this->fromDateTime($row[0]);
			$phptime2 = time();
			$phptime = round(($phptime1 + $phptime2) / 2);
		}
		return $dbtime + (time() - $phptime);
	}
	
	/**
	 * Takes a MySQL script and returns an array of queries.
	 * When DELIMITER is changed, respects that too.
	 * @method scriptToQueries
	 * @param {string} $script The text of the script
	 * @param {callable} [$callback=null] Optional callback to call for each query.
	 * @return {array} An array of the SQL queries.
	 */
	function scriptToQueries($script, $callback = null)
	{
		$this->reallyConnect();
		$version_string = $this->pdo->getAttribute(PDO::ATTR_SERVER_VERSION);
		$version_parts = explode('.', $version_string);
		sprintf("%1d%02d%02d", $version_parts[0], $version_parts[1], $version_parts[2]);
		
		$script_stripped = $script;
		return $this->scriptToQueries_internal($script_stripped, $callback);
	}
	/**
	 * Takes stripped MySQL script and returns an array of queries.
	 * When DELIMITER is changed, respects that too.
	 * @method scriptToQueries_internal
	 * @protected
	 * @param {string} $script The text of the script
	 * @param {callable} [$callback=null] Optional callback to call for each query.
	 * @return {array} An array of the SQL queries.
	 */	
	protected function scriptToQueries_internal($script, $callback = null)
	{
		$queries = array();
		
		$script_len = strlen($script);
	
		$this->reallyConnect();
		$version_string = $this->pdo->getAttribute(PDO::ATTR_SERVER_VERSION);
		$version_parts = explode('.', $version_string);
		$version = sprintf("%1d%02d%02d", $version_parts[0], $version_parts[1], $version_parts[2]);
		
		//$mode_n = 0;  // normal 
		$mode_c = 1;  // comments
		$mode_sq = 2; // single quotes
		$mode_dq = 3; // double quotes
		$mode_bt = 4; // backticks
		$mode_lc = 5; // line comment (hash or double-dash)
		$mode_ds = 6; // delimiter statement
		
		$cur_pos = 0;
		$d = ';'; // delimiter
		$d_len = strlen($d);
		$query_start_pos = 0;
		
		$del_start_pos_array = array();
		$del_end_pos_array = array();
		
		if (class_exists('Q_Config')) {
			$separator = Q_Config::expect('Db', 'sql', 'querySeparator');
		} else {
			$separator = "-------- NEXT QUERY STARTS HERE --------";
		}
		$found = strpos($script, $separator);
		if ($found !== false) {
			// This script was specially crafted for quick parsing
			$queries = explode($separator, $script);
			foreach ($queries as $i => $query) {
				if (!trim($query)) {
					unset($queries[$i]);
				}
			}
			return $queries;
		}
		
		while (1) {
			
			$c_pos = strpos($script, "/*", $cur_pos);
			$sq_pos = strpos($script, "'", $cur_pos);
			$dq_pos = strpos($script, "\"", $cur_pos);
			$bt_pos = strpos($script, "`", $cur_pos);
			$c2_pos = strpos($script, "--", $cur_pos);
			$c3_pos = strpos($script, "#", $cur_pos);
			$ds_pos = stripos($script, "\nDELIMITER ", $cur_pos);
			if ($cur_pos === 0 and substr($script, 0, 9) === 'DELIMITER') {
				$ds_pos = 0;
			}

			$next_pos = false;
			if ($c_pos !== false) {
				$next_mode = $mode_c;
				$next_pos = $c_pos;
				$next_end_str = "*/";
				$next_end_str_len = 2;
			}
			if ($sq_pos !== false and ($next_pos === false or $sq_pos < $next_pos)) {
				$next_mode = $mode_sq;
				$next_pos = $sq_pos;
				$next_end_str = "'";
				$next_end_str_len = 1;
			}
			if ($dq_pos !== false and ($next_pos === false or $dq_pos < $next_pos)) {
				$next_mode = $mode_dq;
				$next_pos = $dq_pos;
				$next_end_str = "\"";
				$next_end_str_len = 1;
			}
			if ($bt_pos !== false and ($next_pos === false or $bt_pos < $next_pos)) {
				$next_mode = $mode_bt;
				$next_pos = $bt_pos;
				$next_end_str = "`";
				$next_end_str_len = 1;
			}
			if ($c2_pos !== false and ($next_pos === false or $c2_pos < $next_pos)
			and ($script[$c2_pos+2] == " " or $script[$c2_pos+2] == "\t")) {
				$next_mode = $mode_lc;
				$next_pos = $c2_pos;
				$next_end_str = "\n";
				$next_end_str_len = 1;
			}
			if ($c3_pos !== false and ($next_pos === false or $c3_pos < $next_pos)) {
				$next_mode = $mode_lc;
				$next_pos = $c3_pos;
				$next_end_str = "\n";
				$next_end_str_len = 1;
			}
			if ($ds_pos !== false and ($next_pos === false or $ds_pos < $next_pos)) {
				$next_mode = $mode_ds;
				$next_pos = $ds_pos;
				$next_end_str = "\n";
				$next_end_str_len = 1;
			}
			
			// If at this point, $next_pos === false, then
			// we are in the final stretch.
			// Until the end of the string, we have normal mode.
			
			// Right now, we are in normal mode.
			$d_pos = strpos($script, $d, $cur_pos);
			while ($d_pos !== false and ($next_pos === false or $d_pos < $next_pos)) {
				$query = substr($script, $query_start_pos, $d_pos - $query_start_pos);
	
				// remove parts of the query string based on the "del_" arrays
				$del_pos_count = count($del_start_pos_array);
				if ($del_pos_count == 0) {
					$query2 = $query;
				} else {
					$query2 = substr($query, 0, $del_start_pos_array[0] - $query_start_pos);
					for ($i=1; $i < $del_pos_count; ++$i) {
						$query2 .= substr($query, $del_end_pos_array[$i-1]  - $query_start_pos, 
							$del_start_pos_array[$i] - $del_end_pos_array[$i-1]);
					}
					$query2 .= substr($query, 
						$del_end_pos_array[$del_pos_count - 1] - $query_start_pos);
				}
	
				$del_start_pos_array = array(); // reset these arrays
				$del_end_pos_array = array(); // reset these arrays
	
				$query_start_pos = $d_pos + $d_len;
				$cur_pos = $query_start_pos;
	
				$query2 = trim($query2);
				if ($query2)
					$queries[] = $query2; // <----- here is where we add to the main array
					if ($callback) {
						call_user_func($callback, $query2);
					}
				
				$d_pos = strpos($script, $d, $cur_pos);
			};
			
			if ($next_pos === false) {
				// Add the last query and get out of here:
				$query = substr($script, $query_start_pos);

				// remove parts of the query string based on the "del_" arrays
				$del_pos_count = count($del_start_pos_array);
				if ($del_pos_count == 0) {
					$query2 = $query;
				} else {
					$query2 = substr($query, 0, $del_start_pos_array[0] - $query_start_pos);
					for ($i=1; $i < $del_pos_count; ++$i) {
						$query2 .= substr($query, $del_end_pos_array[$i-1]  - $query_start_pos, 
							$del_start_pos_array[$i] - $del_end_pos_array[$i-1]);
					}
					if ($del_end_pos_array[$del_pos_count - 1] !== false) {
						$query2 .= substr($query, 
							$del_end_pos_array[$del_pos_count - 1] - $query_start_pos);
					}
				}
				
				$query2 = trim($query2);
				if ($query2) {
					$queries[] = $query2;
					if ($callback) {
						call_user_func($callback, $query2);
					}
				}
				break;
			}
			
			if ($next_mode == $mode_c) {
				// We are inside a comment
				$end_pos = strpos($script, $next_end_str, $next_pos + 1);
				if ($end_pos === false) {
					throw new Exception("unterminated comment -- missing terminating */ characters.");
				}
				
				$version_comment = false;
				if ($script[$next_pos + 2] == '!') {
					$ver = substr($script, $next_pos + 3, 5);
					if ($version >= $ver) {
						// we are in a version comment
						$version_comment = true;
					}
				}
				
				// Add to list of areas to ignore
				if ($version_comment) {
					$del_start_pos_array[] = $next_pos;
					$del_end_pos_array[] = $next_pos + 3 + 5;
					$del_start_pos_array[] = $end_pos;
					$del_end_pos_array[] = $end_pos + $next_end_str_len;
				} else {
					$del_start_pos_array[] = $next_pos;
					$del_end_pos_array[] = $end_pos + $next_end_str_len;
				}
			} else if ($next_mode == $mode_lc) {
				// We are inside a line comment
				$end_pos = strpos($script, $next_end_str, $next_pos + 1);
				$del_start_pos_array[] = $next_pos;
				if ($end_pos !== false) {
					$del_end_pos_array[] = $end_pos + $next_end_str_len;
				} else {
					$del_end_pos_array[] = false;
				}
			} else if ($next_mode == $mode_ds) {
				// We are inside a DELIMITER statement
				$start_pos = $next_pos;
				$end_pos = strpos($script, $next_end_str, $next_pos + 11);
				$del_start_pos_array[] = $next_pos;
				if ($end_pos !== false) {
					$del_end_pos_array[] = $end_pos + $next_end_str_len;
				} else {
					// this is the last statement in the script, it seems.
					// Might look funny, like:
					// DELIMITER aa sfghjkhsgkjlfhdsgjkfdglhdfsgkjfhgjdlk
					$del_end_pos_array[] = false;
				}
				// set a new delimiter!
				$try_d = trim(substr($script, $ds_pos + 11, $end_pos - ($ds_pos + 11)));
				if (!empty($try_d)) {
					$d = $try_d;
					$d_len = strlen($d);
				} // otherwise malformed delimiter statement or end of file
			} else {
				// We are inside a string
				$start_pos = $next_pos;
				$try_end_pos = $next_pos;
				do {
					$end_pos = false;
					$try_end_pos = strpos($script, $next_end_str, $try_end_pos + 1);
					if ($try_end_pos === false) {
						throw new Exception("unterminated string -- missing terminating $next_end_str character.");
					}
					if ($try_end_pos+1 >= $script_len) {
						$end_pos = $try_end_pos;
						break;
					}
					if ($script[$try_end_pos+1] == $next_end_str) {
						++$try_end_pos;
						continue;
					}
					$bs_count = 0;
					for ($i = $try_end_pos - 1; $i > $next_pos; --$i) {
						if ($script[$i] == "\\") {
							++$bs_count;
						} else {
							break;
						}
					}
					if ($bs_count % 2 == 0) {
						$end_pos = $try_end_pos;
					}
				} while ($end_pos === false);
				// If we are here, we have found the end of the string,
				// and are back in normal mode.
			}
	
			// We have exited the previous mode and set end_pos.
			if ($end_pos === false)
				break;
			$cur_pos = $end_pos + $next_end_str_len;
		}
		
		foreach ($queries as $i => $query) {
			if ($query === false) {
				unset($queries[$i]);
			}
		}

		return $queries;
	}
	
	/**
	 * Generates base classes of the models, and if they don't exist,
	 * skeleton code for the models themselves. 
	 * Use it only after you have made changes to the database schema.
	 * You shouldn't be using it on every request.
	 * @method generateModels
	 * @param {string} $directory The directory in which to generate the files.
	 *  If the files already exist, they are not overwritten,
	 *  unless they are inside the "Base" subdirectory.
	 *  If the "Base" subdirectory does not exist, it is created.
	 * @param {string} [$classname_prefix=null] The prefix to prepend to the Base class names.
	 *  If not specified, prefix becomes "connectionName_",  where connectionName is the name of the connection.
	 * @return {array} $filenames The array of filenames for files that were saved.
	 * @throws {Exception} If the $connection is not registered, or the $directory
	 *  does not exist, this function throws an exception.
	 */
	function generateModels (
		$directory, 
		$classname_prefix = null)
	{
		$dc = '/**';
		if (!file_exists($directory))
			throw new Exception("directory $directory does not exist.");
		
		$connectionName = $this->connectionName();
		$conn = Db::getConnection($connectionName);
		
		$prefix = empty($conn['prefix']) ? '' : $conn['prefix'];
		$prefix_len = strlen($prefix);
		
		if (!isset($classname_prefix)) {
			$classname_prefix = isset($connectionName) ? $connectionName . '_' : '';
		}
		
		$rows = $this->rawQuery('SHOW TABLES')->fetchAll();
		
		if (class_exists('Q_Config')) {
			$ext = Q_Config::get('Q', 'extensions', 'class', 'php');
		} else {
			$ext = 'php';
		}
			
		$table_classnames = array();
		$js_table_classes_string = '';
		$class_name_prefix = rtrim(ucfirst($classname_prefix), "._");
		
		$class_extras = $js_class_extras = '';
		
		$filenames = array();
		foreach ($rows as $row) {
			$table_name = $row[0];
			$table_name_base = substr($table_name, $prefix_len);
			$table_name_prefix = substr($table_name, 0, $prefix_len);
			if (empty($table_name_base) or $table_name_prefix != $prefix
			or stristr($table_name, '_Q_') !== false) {
				continue; // no class generated
			}
			
			$class_name_base = null;
			$js_base_class_string = '';
			$base_class_string = $this->codeForModelBaseClass(
				$table_name, 
				$directory, 
				$classname_prefix, 
				$class_name_base, 
				null,
				$js_base_class_string,
				$table_comment
			); // sets the $class_name variable
			$class_name = ucfirst($classname_prefix) . $class_name_base;
			if (empty($class_name)) {
				continue; // no class generated
			}
	
			$class_name_parts = explode('_', $class_name);
			$class_filename = $directory.DS.implode(DS, $class_name_parts).'.php';
			$base_class_filename = $directory.DS.'Base'.DS.implode(DS, $class_name_parts).'.php';
			$js_class_filename = $directory.DS.implode(DS, $class_name_parts).'.js';
			$js_base_class_filename = $directory.DS.'Base'.DS.implode(DS, $class_name_parts).'.js';
			$js_base_class_require = 'Base/'.implode('/', $class_name_parts);
			$js_class_name = implode('.', $class_name_parts);
			$js_base_class_name = implode('.Base.', $class_name_parts);

			$class_extras = is_readable($class_filename.'.inc') ? file_get_contents($class_filename.'.inc') : '';
			$js_class_extras = is_readable($js_class_filename.'.inc') ? file_get_contents($js_class_filename.'.inc') : '';
			
			if ($class_extras) {
				$class_extras = <<<EOT
					
	/* * * *
	 * Including content of '$class_name_base.php.inc' below
	 * * * */
$class_extras
	/* * * */
	
EOT;
			}
			if ($js_class_extras) {
				$js_class_extras = <<<EOT
					
	/* * * *
	 * Including content of '$class_name_base.js.inc' below
	 * * * */
$class_extras
	/* * * */
	
EOT;
			}

			$class_string = <<<EOT
<?php
$dc
 * @module $connectionName
 */
$dc
 * Class representing '$class_name_base' rows in the '$connectionName' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a $table_name_base row in the $connectionName database.
 *
 * @class $class_name
 * @extends Base_$class_name
 */
class $class_name extends Base_$class_name
{
	$dc
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	function setUp()
	{
		parent::setUp();
		// INSERT YOUR CODE HERE
		// e.g. \$this->hasMany(...) and stuff like that.
	}

	/*
	 * Add any $class_name methods here, whether public or not
	 */
	 
	$dc
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @static
	 * @param {array} \$array
	 * @return {{$class_name}} Class instance
	 */
	static function __set_state(array \$array) {
		\$result = new $class_name();
		foreach(\$array as \$k => \$v)
			\$result->\$k = \$v;
		return \$result;
	}
};
EOT;

			$js_class_string = <<<EOT
$dc
 * Class representing $table_name_base rows.
 *
 * This description should be revised and expanded.
 *
 * @module $connectionName
 */
var Q = require('Q');
var Db = Q.require('Db');
var $class_name_base = Q.require('$js_base_class_require');

$dc
 * Class representing '$class_name_base' rows in the '$connectionName' database
$table_comment * @namespace $class_name_prefix
 * @class $class_name_base
 * @extends Base.$js_class_name
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of {column: value} pairs
 */
function $class_name (fields) {

	// Run mixed-in constructors
	$class_name.constructors.apply(this, arguments);
	
	/*
 	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 */
}

Q.mixin($class_name, $class_name_base);

/*
 * Add any public methods here by assigning them to $class_name.prototype
 */

$dc
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
$class_name.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = $class_name;
EOT;

			// overwrite base class file if necessary, but not the class file
			Db_Utils::saveTextFile($base_class_filename, $base_class_string);
			$filenames[] = $base_class_filename;
			Db_Utils::saveTextFile($js_base_class_filename, $js_base_class_string);
			$filenames[] = $js_base_class_filename;
			if (! file_exists($class_filename)) {
				Db_Utils::saveTextFile($class_filename, $class_string);
				$filenames[] = $class_filename;
			}
			if (! file_exists($js_class_filename)) {
				Db_Utils::saveTextFile($js_class_filename, $js_class_string);
				$filenames[] = $js_class_filename;
			}
			
			$table_classnames[] = $class_name;
			$js_table_classes_string .= <<<EOT

$dc
 * Link to $connectionName.$class_name_base model
 * @property $class_name_base
 * @type $connectionName.$class_name_base
 */
Base.$class_name_base = Q.require('$connectionName/$class_name_base');

EOT;
		}
		
		// Generate the "module model" base class file
		$table_classnames_exported = var_export($table_classnames, true);
		$table_classnames_json = $pk_json_indented = str_replace(
			array("[", ",", "]"),
			array("[\n\t", ",\n\t", "\n]"),
			json_encode($table_classnames)
		);
		if (!empty($connectionName)) {
			$class_name = Db::generateTableClassName($connectionName);
			$class_name_parts = explode('_', $class_name);
			$class_filename = $directory.DS.implode(DS, $class_name_parts).'.php';
			$base_class_filename = $directory.DS.'Base'.DS.implode(DS, $class_name_parts).'.php';
			$js_class_filename = $directory.DS.implode(DS, $class_name_parts).'.js';
			$js_base_class_filename = $directory.DS.'Base'.DS.implode(DS, $class_name_parts).'.js';
			$js_base_class_require = 'Base'.'/'.implode('/', $class_name_parts);
			$dbname =
			// because table name can be {{prefix}}_Q_plugin or {{prefix}}_Q_app we need to know correct table name
			$tables = $this->rawQuery(
				"SELECT table_comment"
				." FROM INFORMATION_SCHEMA.TABLES"
				." WHERE table_schema = '{$this->dbname}' and table_name LIKE '{$prefix}Q_%'"
			)->execute()->fetchAll(PDO::FETCH_NUM);
			$model_comment = (!empty($tables[0]['table_comment']))
				 ? " * <br>{".$tables[0]['table_comment']."}\n"
				 : '';
			$model_extras = is_readable($class_filename.'.inc') ? file_get_contents($class_filename.'.inc') : '';
			$js_model_extras = is_readable($js_class_filename.'.inc') ? file_get_contents($js_class_filename.'.inc') : '';

			$base_class_string = <<<EOT
<?php

$dc
 * Autogenerated base class for the $connectionName model.
 * 
 * Don't change this file, since it can be overwritten.
 * Instead, change the $class_name.php file.
 *
 * @module $connectionName
 */
$dc
 * Base class for the $class_name model
 * @class Base_$class_name
 */
abstract class Base_$class_name
{
	$dc
	 * The list of model classes
	 * @property \$table_classnames
	 * @type array
	 */
	static \$table_classnames = $table_classnames_exported;
$class_extras
	$dc
     * This method calls Db.connect() using information stored in the configuration.
     * If this has already been called, then the same db object is returned.
	 * @method db
	 * @return {Db_Interface} The database object
	 */
	static function db()
	{
		return Db::connect('$connectionName');
	}

	$dc
	 * The connection name for the class
	 * @method connectionName
	 * @return {string} The name of the connection
	 */
	static function connectionName()
	{
		return '$connectionName';
	}
};
EOT;

			$js_base_class_string = <<<EOT
$dc
 * Autogenerated base class for the $connectionName model.
 * 
 * Don't change this file, since it can be overwritten.
 * Instead, change the $class_name.js file.
 *
 * @module $connectionName
 */
var Q = require('Q');
var Db = Q.require('Db');
$js_class_extras
$dc
 * Base class for the $class_name model
 * @namespace Base
 * @class $class_name
 * @static
 */
function Base () {
	return this;
}
 
module.exports = Base;

$dc
 * The list of model classes
 * @property tableClasses
 * @type array
 */
Base.tableClasses = $table_classnames_json;

$dc
 * This method calls Db.connect() using information stored in the configuration.
 * If this has already been called, then the same db object is returned.
 * @method db
 * @return {Db} The database connection
 */
Base.db = function () {
	return Db.connect('$connectionName');
};

$dc
 * The connection name for the class
 * @method connectionName
 * @return {string} The name of the connection
 */
Base.connectionName = function() {
	return '$connectionName';
};
$js_table_classes_string
EOT;

		$class_string = <<<EOT
<?php
$dc
 * $class_name_prefix model
$model_comment * @module $connectionName
 * @main $connectionName
 */
$dc
 * Static methods for the $connectionName models.
 * @class $class_name
 * @extends Base_$class_name
 */
abstract class $class_name extends Base_$class_name
{
	/*
	 * This is where you would place all the static methods for the models,
	 * the ones that don't strongly pertain to a particular row or table.
	 * If file '$class_name.php.inc' exists, its content is included
	 * * * */
$model_extras
	/* * * */
};
EOT;

		$js_class_string = <<<EOT
$dc
 * $class_name_prefix model
$model_comment * @module $connectionName
 * @main $connectionName
 */
var Q = require('Q');

$dc
 * Static methods for the $class_name_prefix model
 * @class $class_name_prefix
 * @extends Base.$class_name_prefix
 * @static
 */
function $connectionName() { };
module.exports = $connectionName;

var Base_$connectionName = Q.require('$js_base_class_require');
Q.mixin($connectionName, Base_$connectionName);

/*
 * This is where you would place all the static methods for the models,
 * the ones that don't strongly pertain to a particular row or table.
 * Just assign them as methods of the $connectionName object.
 * If file '$class_name.js.inc' exists, its content is included
 * * * */
$js_model_extras
/* * * */
EOT;

			// overwrite base class file if necessary, but not the class file
			Db_Utils::saveTextFile($base_class_filename, $base_class_string);
			$filenames[] = $base_class_filename;
			Db_Utils::saveTextFile($js_base_class_filename, $js_base_class_string);
			$filenames[] = $js_base_class_filename;
			if (! file_exists($class_filename)) {
				$filenames[] = $class_filename;
				Db_Utils::saveTextFile($class_filename, $class_string);
			}
			if (! file_exists($js_class_filename)) {
				$filenames[] = $js_class_filename;
				Db_Utils::saveTextFile($js_class_filename, $js_class_string);
			}
		}
		$directoryLen = strlen($directory.DS);
		foreach ($filenames as $i => $filename) {
			$filenames[$i] = substr($filename, $directoryLen);
		}
		return $filenames;
	}

	/**
	 * Generates code for a base class for the model
	 * @method codeForModelBaseClass
	 * @param {string} $table The name of the table to generate the code for.
	 * @param {string} $directory The path of the directory in which to place the model code.
	 * @param {string} [$classname_prefix=''] The prefix to prepend to the generated class names
	 * @param {&string} [$class_name_base=null] If set, this is the class name that is used.
	 *  If an unset variable is passed, it is filled with the
	 *  class name that is ultimately chosen, without the $classname_prefix
	 * @param {string} [$prefix=null] Defaults to the prefix of the tables, as specified in the connection.
	 *  Pass null here to use the default, or a string to override it.
	 * @param {&string} [$js_code=null] The javascript code for the base class
	 * @param {&string} [$table_comment=''] The comment from the MySQL table if any
	 * @return {string} The generated code for the class.
	 */
	function codeForModelBaseClass (
		$table_name, 
		$directory,
		$classname_prefix = '',
		&$class_name_base = null,
		$prefix = null,
		&$js_code = null,
		&$table_comment = '')
	{
		$dc = '/**';
		if (empty($table_name))
			throw new Exception('table_name parameter is empty', - 2);
		if (empty($directory))
			throw new Exception('directory parameter is empty', - 3);
	
		$connectionName = $this->connectionName();
		$conn = Db::getConnection($connectionName);
		
		if (!isset($prefix)) {
			$prefix = empty($conn['prefix']) ? '' : $conn['prefix'];
		}
		if (!empty($prefix)) {
			$prefix_len = strlen($prefix);
			$table_name_base = substr($table_name, $prefix_len);
			$table_name_prefix = substr($table_name, 0, $prefix_len);
			if (empty($table_name_base) or $table_name_prefix != $prefix)
				return ''; // no class generated
		} else {
			$table_name_base = $table_name;
		}

		if (empty($classname_prefix))
			$classname_prefix = '';
		if (!isset($class_name_base)) {
			$class_name_base = Db::generateTableClassName($table_name_base);
		}
		$class_name = ucfirst($classname_prefix) . $class_name_base;
		$table_cols = $this->rawQuery("SHOW FULL COLUMNS FROM $table_name")->execute()->fetchAll(PDO::FETCH_ASSOC);
		$table_status = $this->rawQuery("SHOW TABLE STATUS WHERE Name = '$table_name'")->execute()->fetchAll(PDO::FETCH_COLUMN, 17);
		$table_comment = (!empty($table_status[0])) ? " * <br>{$table_status[0]}\n" : '';
		// Calculate primary key
		$pk = array();
		foreach ($table_cols as $k => $table_col) {
			if ($table_col['Key'] == 'PRI') {
				$pk[] = $table_col['Field'];
			}
			if (!empty($table_col['Default'])
			and strtolower($table_col['Default']) === 'current_timestamp()') {
				$table_cols[$k]['Default'] = 'CURRENT_TIMESTAMP';
			}
		}
		$pk_exported = var_export($pk, true);
		$pk_json = json_encode($pk);
		
		// Calculate validation functions
		$functions = array();
		$js_functions = array();
		$field_names = array();
		$field_nulls = array();
		$properties = array();
		$js_properties = array();
		$required_field_names = array();
		$magic_field_names = array();
		$defaults = array();
		$comments = array();
		foreach ($table_cols as $table_col) {
			$is_magic_field = null;
			$field_name = $table_col['Field'];
			$field_names[] = $field_name;
			$field_null = $table_col['Null'] == 'YES' ? true : false;
			$field_nulls[] = $field_null;
			$field_default = $table_col['Default'];
			$comments[] = $table_col['Comment'];
			$field_name_safe = preg_replace('/[^0-9a-zA-Z\_]/', '_', $field_name);
			$auto_inc = (strpos($table_col['Extra'], 'auto_increment') !== false);
			$type = $table_col['Type'];
			$pieces = explode('(', $type);
			if (isset($pieces[1])) {
				$pieces2 = explode(')', $pieces[1]);
				$pieces2_count = count($pieces2);
				if ($pieces2_count > 2) { // could happen if enum's values have ")"
					$pieces2 = array(
						implode(')', array_slice($pieces2, 0, -1)), 
						end($pieces2)
					);
				}
			}
			$type_name = $pieces[0];
			if (isset($pieces2)) {
				$type_display_range = $pieces2[0];
				$type_modifiers = $pieces2[1];
				$type_unsigned = (strpos($type_modifiers, 'unsigned') !== false);
			}
			
			$isTextLike = false;
			$isNumberLike = false;
			$isTimeLike = false;
			
			switch ($type_name) {
				case 'tinyint':
					$type_range_min = $type_unsigned ? 0 : - 128;
					$type_range_max = $type_unsigned ? 255 : 127;
					break;
				case 'smallint':
					$type_range_min = $type_unsigned ? 0 : - 32768;
					$type_range_max = $type_unsigned ? 65535 : 32767;
					break;
				case 'mediumint':
					$type_range_min = $type_unsigned ? 0 : - 8388608;
					$type_range_max = $type_unsigned ? 16777215 : 8388607;
					break;
				case 'int':
					$type_range_min = $type_unsigned ? 0 : - 2147483648;
					$type_range_max = $type_unsigned ? 4294967295 : 2147483647;
					break;
				case 'bigint':
					$type_range_min = $type_unsigned ? 0 : - 9223372036854775808;
					$type_range_max = $type_unsigned ? 18446744073709551615 : 9223372036854775807;
					break;
				case 'tinytext':
				case 'tinyblob':
					$type_display_range = 255;
					break;
				case 'text':
				case 'blob':
					$type_display_range = 65535;
					break;
				case 'mediumtext':
				case 'mediumblob':
					$type_display_range = 16777216;
					break;
				case 'longtext':
				case 'longblob':
					$type_display_range = 4294967296;
					break;
			}
			$field_name_exported = var_export($field_name, true);
			
			$null_check = $field_null ? "if (!isset(\$value)) {\n\t\t\treturn array($field_name_exported, \$value);\n\t\t}\n\t\t" : '';
			$null_fix = $field_null ? '' : "if (!isset(\$value)) {\n\t\t\t\$value='';\n\t\t}\n\t\t";
			$dbe_check = "if (\$value instanceof Db_Expression\n               or \$value instanceof Db_Range) {\n\t\t\treturn array($field_name_exported, \$value);\n\t\t}\n\t\t";
			$js_null_check = $field_null ? "if (value == undefined) return value;\n\t\t" : '';
			$js_null_fix = $field_null ? '' : "if (value == null) {\n\t\t\tvalue='';\n\t\t}\n\t\t";
			$js_dbe_check = "if (value instanceof Db.Expression) return value;\n\t\t";
			if (! isset($functions["beforeSet_$field_name_safe"]))
				$functions["beforeSet_$field_name_safe"] = array();
			if (! isset($js_functions["beforeSet_$field_name_safe"]))
				$js_functions["beforeSet_$field_name_safe"] = array();
			$type_name_lower = strtolower($type_name);
			switch ($type_name_lower) {
				case 'tinyint':
				case 'smallint':
				case 'int':
				case 'mediumint':
				case 'bigint':
					$isNumberLike = true;
					$properties[]="integer $field_name";
					$js_properties[] = "Integer $field_name";
					$functions["maxSize_$field_name_safe"]['comment'] = <<<EOT
	$dc
	 * @method maxSize_$field_name_safe
	 * Returns the maximum integer that can be assigned to the $field_name field
	 * @return {integer}
	 */
EOT;
					$functions["maxSize_$field_name_safe"]['args'] = '';
					$functions["maxSize_$field_name_safe"]['return_statement'] = <<<EOT
		return $type_range_max;
EOT;
					$functions["beforeSet_$field_name_safe"][] = <<<EOT
		{$null_check}{$dbe_check}if (!is_numeric(\$value) or floor(\$value) != \$value)
			throw new Exception('Non-integer value being assigned to '.\$this->getTable().".$field_name");
		\$value = intval(\$value);
		if (\$value < $type_range_min or \$value > $type_range_max) {
			\$json = json_encode(\$value);
			throw new Exception("Out-of-range value \$json being assigned to ".\$this->getTable().".$field_name");
		}
EOT;
					$functions["beforeSet_$field_name_safe"]['comment'] = <<<EOT
	$dc
	 * Method is called before setting the field and verifies if integer value falls within allowed limits
	 * @method beforeSet_$field_name_safe
	 * @param {integer} \$value
	 * @return {array} An array of field name and value
	 * @throws {Exception} An exception is thrown if \$value is not integer or does not fit in allowed range
	 */
EOT;
					$js_functions["maxSize_$field_name_safe"]['comment'] = <<<EOT
$dc
 * Returns the maximum integer that can be assigned to the $field_name field
 * @return {integer}
 */
EOT;
					$js_functions["maxSize_$field_name_safe"]['args'] = '';
					$js_functions["maxSize_$field_name_safe"]['return_statement'] = <<<EOT
		return $type_range_max;
EOT;
					$js_functions["beforeSet_$field_name_safe"][] = <<<EOT
		{$js_null_check}{$js_dbe_check}value = Number(value);
		if (isNaN(value) || Math.floor(value) != value) 
			throw new Error('Non-integer value being assigned to '+this.table()+".$field_name");
		if (value < $type_range_min || value > $type_range_max)
			throw new Error("Out-of-range value "+JSON.stringify(value)+" being assigned to "+this.table()+".$field_name");
EOT;
					$js_functions["beforeSet_$field_name_safe"]['comment'] = <<<EOT
$dc
 * Method is called before setting the field and verifies if integer value falls within allowed limits
 * @method beforeSet_$field_name_safe
 * @param {integer} value
 * @return {integer} The value
 * @throws {Error} An exception is thrown if 'value' is not integer or does not fit in allowed range
 */
EOT;
					$default = isset($table_col['Default'])
						? $table_col['Default']
						: ($field_null ? null : 0);
					$js_defaults[] = $defaults[] = json_encode((int)$default);
					break;

				case 'enum':
					$properties[]="string $field_name";
					$js_properties[] = "String $field_name";
					$functions["beforeSet_$field_name_safe"][] = <<<EOT
		{$null_check}{$dbe_check}if (!in_array(\$value, array($type_display_range)))
			throw new Exception("Out-of-range value '\$value' being assigned to ".\$this->getTable().".$field_name");
EOT;
					$functions["beforeSet_$field_name_safe"]['comment'] = <<<EOT
	$dc
	 * Method is called before setting the field and verifies if value belongs to enum values list
	 * @method beforeSet_$field_name_safe
	 * @param {string} \$value
	 * @return {array} An array of field name and value
	 * @throws {Exception} An exception is thrown if \$value does not belong to enum values list
	 */
EOT;
					$js_functions["beforeSet_$field_name_safe"][] = <<<EOT
		{$js_null_check}{$js_dbe_check}if ([$type_display_range].indexOf(value) < 0)
			throw new Error("Out-of-range value "+JSON.stringify(value)+" being assigned to "+this.table()+".$field_name");
EOT;
					$js_functions["beforeSet_$field_name_safe"]['comment'] = <<<EOT
$dc
 * Method is called before setting the field and verifies if value belongs to enum values list
 * @method beforeSet_$field_name_safe
 * @param {string} value
 * @return {string} The value
 * @throws {Error} An exception is thrown if 'value' does not belong to enum values list
 */
EOT;
					$default = isset($table_col['Default'])
						? $table_col['Default']
						: null;
					$js_defaults[] = $defaults[] = json_encode($default);
					break;
				
				case 'char':
				case 'varchar':
				case 'binary':
				case 'varbinary':
				case 'tinytext':
				case 'text':
				case 'mediumtext':
				case 'longtext':
				case 'tinyblob':
				case 'blob':
				case 'mediumblob':
				case 'longblob':
					$isTextLike = true;
					$isBinary = in_array($type_name_lower, array(
						'binary', 'varbinary',
						'tinyblob', 'blob', 'mediumblob', 'longblob'
					));
					$orBuffer1 = $isBinary ? "|Buffer" : "";
					$properties[]="string $field_name";
					$js_properties[] = "String$orBuffer1 $field_name";
					$functions["maxSize_$field_name_safe"]['comment'] = <<<EOT
	$dc
	 * Returns the maximum string length that can be assigned to the $field_name field
	 * @return {integer}
	 */
EOT;
					$functions["maxSize_$field_name_safe"]['args'] = '';
					$functions["maxSize_$field_name_safe"]['return_statement'] = <<<EOT
		return $type_display_range;
EOT;
					$functions["beforeSet_$field_name_safe"][] = <<<EOT
		{$null_check}{$null_fix}{$dbe_check}if (!is_string(\$value) and !is_numeric(\$value))
			throw new Exception('Must pass a string to '.\$this->getTable().".$field_name");

EOT;
					if ($type_display_range and $type_display_range < $this->maxCheckStrlen) {
						$functions["beforeSet_$field_name_safe"][] = <<<EOT
		if (strlen(\$value) > $type_display_range)
			throw new Exception('Exceedingly long value being assigned to '.\$this->getTable().".$field_name");
EOT;
					}
					$functions["beforeSet_$field_name_safe"]['comment'] = <<<EOT
	$dc
	 * Method is called before setting the field and verifies if value is string of length within acceptable limit.
	 * Optionally accept numeric value which is converted to string
	 * @method beforeSet_$field_name
	 * @param {string} \$value
	 * @return {array} An array of field name and value
	 * @throws {Exception} An exception is thrown if \$value is not string or is exceedingly long
	 */
EOT;
					$js_functions["maxSize_$field_name_safe"]['comment'] = <<<EOT
	$dc
	 * Returns the maximum string length that can be assigned to the $field_name field
	 * @return {integer}
	 */
EOT;
					$js_functions["maxSize_$field_name_safe"]['args'] = '';
					$js_functions["maxSize_$field_name_safe"]['return_statement'] = <<<EOT
		return $type_display_range;
EOT;
					$bufferCheck = $isBinary ? " && !(value instanceof Buffer)" : "";
					$orBuffer2 = $isBinary ? " or Buffer" : "";
					$js_functions["beforeSet_$field_name_safe"][] = <<<EOT
		{$js_null_check}{$js_null_fix}{$js_dbe_check}if (typeof value !== "string" && typeof value !== "number"$bufferCheck)
			throw new Error('Must pass a String$orBuffer2 to '+this.table()+".$field_name");
		if (typeof value === "string" && value.length > $type_display_range)
			throw new Error('Exceedingly long value being assigned to '+this.table()+".$field_name");
EOT;
					$js_functions["beforeSet_$field_name_safe"]['comment'] = <<<EOT
$dc
 * Method is called before setting the field and verifies if value is string of length within acceptable limit.
 * Optionally accept numeric value which is converted to string
 * @method beforeSet_$field_name_safe
 * @param {string} value
 * @return {string} The value
 * @throws {Error} An exception is thrown if 'value' is not string or is exceedingly long
 */
EOT;
					$default = isset($table_col['Default'])
						? $table_col['Default']
						: ($field_null ? null : '');
					$js_defaults[] = $defaults[] = json_encode($default);
					break;
				
				case 'date':
					$isTimeLike = true;
					$properties[]="string|Db_Expression $field_name";
					$js_properties[] = "String|Db.Expression $field_name";
					$functions["beforeSet_$field_name_safe"][] = <<<EOT
		{$null_check}{$dbe_check}\$date = date_parse(\$value);
		if (!empty(\$date['errors'])) {
			\$json = json_encode(\$value);
			throw new Exception("Date \$json in incorrect format being assigned to ".\$this->getTable().".$field_name");
		}
		\$value = date("Y-m-d H:i:s", strtotime(\$value));
		\$date = date_parse(\$value);
		foreach (array('year', 'month', 'day', 'hour', 'minute', 'second') as \$v) {
			\$\$v = \$date[\$v];
		}
		\$value = sprintf("%04d-%02d-%02d", \$year, \$month, \$day);
EOT;
					$functions["beforeSet_$field_name_safe"]['comment'] = <<<EOT
	$dc
	 * Method is called before setting the field and normalize the date string
	 * @method beforeSet_$field_name_safe
	 * @param {string} \$value
	 * @return {array} An array of field name and value
	 * @throws {Exception} An exception is thrown if \$value does not represent valid date
	 */
EOT;
					$js_functions["beforeSet_$field_name_safe"][] = <<<EOT
		{$js_null_check}{$js_dbe_check}value = (value instanceof Date) ? Base.db().toDateTime(value) : value;
EOT;
					$js_functions["beforeSet_$field_name_safe"]['comment'] = <<<EOT
$dc
 * Method is called before setting the field
 * @method beforeSet_$field_name_safe
 * @param {String} value
 * @return {Date|Db.Expression} If 'value' is not Db.Expression the current date is returned
 */
EOT;
					$default = isset($table_col['Default'])
						? $table_col['Default']
						: ($field_null ? null : '');
					$isExpression = (
						$default === 'CURRENT_TIMESTAMP'
						or strpos($default, '(') !== false
					);
					$defaults[] = $isExpression
						? 'new Db_Expression(' . json_encode($default) . ')'
						: json_encode($default);
					$js_defaults[] = $isExpression
						? 'new Db.Expression(' . json_encode($default) . ')'
						: json_encode($default);
					break;
				case 'datetime':
				case 'timestamp':
					$isTimeLike = true;
					$properties[]="string|Db_Expression $field_name";
					$js_properties[] = "String|Db.Expression $field_name";
					$possibleMagicFields = array('insertedTime', 'updatedTime', 'created_time', 'updated_time');
					$possibleMagicInsertFields = array('insertedTime', 'created_time');
					if (in_array($field_name, $possibleMagicFields)) {
						if (!in_array($field_name, $possibleMagicInsertFields)
						or !isset($field_default)) {
							$magic_field_names[] = $field_name;
							$is_magic_field = true;
						}
					}
					$functions["beforeSet_$field_name_safe"][] = <<<EOT
		{$null_check}{$dbe_check}if (\$value instanceof DateTime) {
			\$value = \$value->getTimestamp();
		}
		if (is_numeric(\$value)) {
			\$newDateTime = new DateTime();
			\$datetime = \$newDateTime->setTimestamp(\$value);
		} else {
			\$datetime = new DateTime(\$value);
		}
		\$value = \$datetime->format("Y-m-d H:i:s");
EOT;
					$functions["beforeSet_$field_name_safe"]['comment'] = <<<EOT
	$dc
	 * Method is called before setting the field and normalize the DateTime string
	 * @method beforeSet_$field_name_safe
	 * @param {string} \$value
	 * @return {array} An array of field name and value
	 * @throws {Exception} An exception is thrown if \$value does not represent valid DateTime
	 */
EOT;
					$js_functions["beforeSet_$field_name_safe"][] = <<<EOT
		{$js_null_check}{$js_dbe_check}if (typeof value !== 'object' && !isNaN(value)) {
			value = parseInt(value);
			value = new Date(value < 10000000000 ? value * 1000 : value);
		}
		value = (value instanceof Date) ? Base.db().toDateTime(value) : value;
EOT;
					$js_functions["beforeSet_$field_name_safe"]['comment'] = <<<EOT
$dc
 * Method is called before setting the field
 * @method beforeSet_$field_name_safe
 * @param {String} value
 * @return {Date|Db.Expression} If 'value' is not Db.Expression the current date is returned
 */
EOT;
					$default = isset($table_col['Default'])
						? $table_col['Default']
						: ($field_null ? null : '');
					$isExpression = (
						$default === 'CURRENT_TIMESTAMP'
						or ($default and strpos($default, '(') !== false)
					);
					$defaults[] = $isExpression
						? 'new Db_Expression(' . json_encode($default) . ')'
						: json_encode($default);
					$js_defaults[] = $isExpression
						? 'new Db.Expression(' . json_encode($default) . ')'
						: json_encode($default);
					break;

				case 'numeric':
				case 'decimal':
				case 'float':
				case 'double':
					$isNumberLike = true;
					$properties[]="float $field_name";
					$js_properties[] = "Number $field_name";
					$functions["beforeSet_$field_name_safe"][] = <<<EOT
		{$null_check}{$dbe_check}if (!is_numeric(\$value))
			throw new Exception('Non-numeric value being assigned to '.\$this->getTable().".$field_name");
		\$value = floatval(\$value);
EOT;
					$js_functions["beforeSet_$field_name_safe"][] = <<<EOT
		{$js_null_check}{$js_dbe_check}value = Number(value);
		if (isNaN(value))
			throw new Error('Non-number value being assigned to '+this.table()+".$field_name");
EOT;
					$js_functions["beforeSet_$field_name_safe"]['comment'] = <<<EOT
$dc
 * Method is called before setting the field to verify if value is a number
 * @method beforeSet_$field_name_safe
 * @param {integer} value
 * @return {integer} The value
 * @throws {Error} If 'value' is not number
 */
EOT;
					$default = isset($table_col['Default'])
						? $table_col['Default']
						: ($field_null ? null : 0);
					$js_defaults[] = $defaults[] = json_encode((double)$default);
					break;

				default:
					$properties[]="mixed $field_name";
					$js_properties[] = "mixed $field_name";
					$default = isset($table_col['Default'])
						? $table_col['Default']
						: ($field_null ? null : '');
					$js_defaults[] = $defaults[] = json_encode($default);
					break;
			}
			if (! empty($functions["beforeSet_$field_name_safe"])) {
				$functions["beforeSet_$field_name_safe"]['return_statement'] = <<<EOT
		return array('$field_name', \$value);
EOT;
			}
			if (! empty($js_functions["beforeSet_$field_name_safe"])) {
				$js_functions["beforeSet_$field_name_safe"]['return_statement'] = <<<EOT
		return value;
EOT;
			}
			if (! $field_null and ! $is_magic_field
			and ((!$isNumberLike and !$isTextLike) or in_array($field_name, $pk))
			and ! $auto_inc and !isset($field_default)) {
				$required_field_names[] = $field_name_exported;
			}
			
			$columnInfo = array(
				array($type_name, $type_display_range, $type_modifiers, $type_unsigned),
				$field_null,
				$table_col['Key'],
				$table_col['Default']
			);
			$columnInfo_php = var_export($columnInfo, true);
			$columnInfo_js = json_encode($columnInfo);
			$functions["column_$field_name_safe"]['comment'] = <<<EOT
	$dc
	 * Returns schema information for $field_name column
	 * @return {array} [[typeName, displayRange, modifiers, unsigned], isNull, key, default]
	 */
EOT;
			$functions["column_$field_name_safe"]['static'] = true;
			$functions["column_$field_name_safe"]['args'] = '';
			$functions["column_$field_name_safe"]['return_statement'] = <<<EOT
return $columnInfo_php;
EOT;
			$js_functions["column_$field_name_safe"]['static'] = true;
			$js_functions["column_$field_name_safe"]['comment'] = <<<EOT
	$dc
	 * Returns schema information for $field_name column
	 * @return {array} [[typeName, displayRange, modifiers, unsigned], isNull, key, default]
	 */
EOT;
			$js_functions["column_$field_name_safe"]['args'] = '';
			$js_functions["column_$field_name_safe"]['return_statement'] = <<<EOT
return $columnInfo_js;
EOT;
		
		}
		
		$field_names_json = json_encode($field_names);
		$field_names_json_indented = str_replace(
			array("[", ",", "]"),
			array("[\n\t\t", ",\n\t\t", "\n\t]"),
			$field_names_json
		);
		
		
		$field_names_exported = "\$this->fieldNames()";
		
		$functions['beforeSave'] = array();
		$js_functions['beforeSave'] = array();
		if ($required_field_names) {
			$required_fields_string = implode(',', $required_field_names);
			$beforeSave_code = <<<EOT
		if (!\$this->retrieved) {
			\$table = \$this->getTable();
			foreach (array($required_fields_string) as \$name) {
				if (!isset(\$value[\$name])) {
					throw new Exception("the field \$table.\$name needs a value, because it is NOT NULL, not auto_increment, and lacks a default value.");
				}
			}
		}
EOT;
			$js_beforeSave_code = <<<EOT
	var fields = [$required_fields_string], i;
	if (!this._retrieved) {
		var table = this.table();
		for (i=0; i<fields.length; i++) {
			if (this.fields[fields[i]] === undefined) {
				throw new Error("the field "+table+"."+fields[i]+" needs a value, because it is NOT NULL, not auto_increment, and lacks a default value.");
			}
		}
	}
EOT;
			$return_statement = <<<EOT
		return \$value;
EOT;
			$js_return_statement = <<<EOT
	return value;
EOT;
			$functions["beforeSave"][] = $beforeSave_code;
			$functions['beforeSave']['return_statement'] = $return_statement;
			$functions['beforeSave']['comment'] = <<<EOT
	$dc
	 * Check if mandatory fields are set and updates 'magic fields' with appropriate values
	 * @method beforeSave
	 * @param {array} \$value The array of fields
	 * @return {array}
	 * @throws {Exception} If mandatory field is not set
	 */
EOT;
			$js_functions["beforeSave"][] = $js_beforeSave_code;
			$js_functions['beforeSave']['return_statement'] = $js_return_statement;
			$js_functions['beforeSave']['comment'] = <<<EOT
$dc
 * Check if mandatory fields are set and updates 'magic fields' with appropriate values
 * @method beforeSave
 * @param {Object} value The object of fields
 * @param {Function} callback Call this callback if you return null
 * @return {Object|null} Return the fields, modified if necessary. If you return null, then you should call the callback(err, modifiedFields)
 * @throws {Error} If e.g. mandatory field is not set or a bad values are supplied
 */
EOT;
		}

		//$functions['beforeSave'] = array();
		if (count($magic_field_names) > 0) {
			$beforeSave_code = '';
			$js_beforeSave_code = '';
			foreach (array('created_time', 'insertedTime') as $cmf) {
				if (in_array($cmf, $magic_field_names)) {
					$beforeSave_code .= <<<EOT

		if (!\$this->retrieved and !isset(\$value['$cmf'])) {
			\$this->$cmf = \$value['$cmf'] = new Db_Expression('CURRENT_TIMESTAMP');
		}

EOT;
					$js_beforeSave_code .= <<<EOT

	if (!this._retrieved && !value['$cmf']) {
		this['$cmf'] = value['$cmf'] = new Db.Expression('CURRENT_TIMESTAMP');
	}
EOT;
					break;
				}
			}
			foreach (array('updated_time', 'updatedTime') as $umf) {
				if (in_array($umf, $magic_field_names)) {
					$beforeSave_code .= <<<EOT
						
		// convention: we'll have $umf = $cmf if just created.
		\$this->$umf = \$value['$umf'] = new Db_Expression('CURRENT_TIMESTAMP');
EOT;
					$js_beforeSave_code .= <<<EOT

	// convention: we'll have $umf = $cmf if just created.
	this['$umf'] = value['$umf'] = new Db.Expression('CURRENT_TIMESTAMP');
EOT;
					break;
				}
			}
			$return_statement = <<<EOT
		return \$value;
EOT;
			$js_return_statement = <<<EOT
	return value;
EOT;
			$functions['beforeSave'][] = $beforeSave_code;
			$functions['beforeSave']['return_statement'] = $return_statement;
			$js_functions['beforeSave'][] = $js_beforeSave_code;
			$js_functions['beforeSave']['return_statement'] = $js_return_statement;
		}
		
		$functions['fieldNames'] = array();
		$fieldNames_exported = Db_Utils::var_export($field_names);
		$fieldNames_code = <<<EOT
		\$field_names = $fieldNames_exported;
		\$result = \$field_names;
		if (!empty(\$table_alias)) {
			\$temp = array();
			foreach (\$result as \$field_name)
				\$temp[] = \$table_alias . '.' . \$field_name;
			\$result = \$temp;
		} 
		if (!empty(\$field_alias_prefix)) {
			\$temp = array();
			reset(\$field_names);
			foreach (\$result as \$field_name) {
				\$temp[\$field_alias_prefix . current(\$field_names)] = \$field_name;
				next(\$field_names);
			}
			\$result = \$temp;
		}
EOT;
		$return_statement = <<<EOT
		return \$result;
EOT;
		$functions['fieldNames'][] = $fieldNames_code;
		$functions['fieldNames']['return_statement'] = $return_statement;
		$functions['fieldNames']['args'] = '$table_alias = null, $field_alias_prefix = null';
		$functions['fieldNames']['static'] = true;
		$functions['fieldNames']['comment'] = <<<EOT
	$dc
	 * Retrieves field names for class table
	 * @method fieldNames
	 * @static
	 * @param {string} [\$table_alias=null] If set, the alieas is added to each field
	 * @param {string} [\$field_alias_prefix=null] If set, the method returns associative array of ('prefixed field' => 'field') pairs
	 * @return {array} An array of field names
	 */
EOT;
		$functions_code = array();
		foreach ($functions as $func_name => $func_code) {
			$func_args = isset($func_code['args']) ? $func_code['args'] : '$value';
			$func_modifiers = !empty($func_code['static']) ? 'static ' : '';
			$func_code_string = isset($func_code['comment']) ? $func_code['comment']."\n" : '';
			$func_code_string .= <<<EOT
	{$func_modifiers}function $func_name($func_args)
	{

EOT;
			if (is_array($func_code) and ! empty($func_code)) {
				foreach ($func_code as $key => $code_tool) {
					if (is_string($key))
						continue;
					$func_code_string .= $code_tool;
				}
				$func_code_string .= "\n" . $func_code['return_statement'];
			}
			$func_code_string .= <<<EOT
			
	}
EOT;
			if (! empty($func_code))
				$functions_code[] = $func_code_string;
		}
		$functions_string = implode("\n\n", $functions_code);
	
		foreach ($js_functions as $func_name => $func_code) {
			$func_args = isset($func_code['args']) ? $func_code['args'] : 'value';
			$instance = isset($func_code['instance']) ? '.prototype' : '';
			$func_code_string = isset($func_code['comment']) ? $func_code['comment']."\n" : '';
			$prototype = empty($func_code['static']) ? 'prototype.' : '';
			$func_code_string .= <<<EOT
Base.$prototype$func_name = function ($func_args) {

EOT;
			if (is_array($func_code) and ! empty($func_code)) {
				foreach ($func_code as $key => $code_tool) {
					if (is_string($key))
						continue;
					$func_code_string .= $code_tool;
				}
				$func_code_string .= "\n" . $func_code['return_statement'];
			}
			$func_code_string .= <<<EOT

};
EOT;
			if (! empty($func_code))
				$js_functions_code[] = $func_code_string;
		}
		$js_functions_string = implode("\n\n", $js_functions_code);

		$pk_exported_indented = str_replace("\n", "\n\t\t\t", $pk_exported);
		$pk_json_indented = str_replace(
			array("[", ",", "]"),
			array("[\n\t\t", ",\n\t\t", "\n\t]"),
			$pk_json
		);
		$connectionName_var = var_export($connectionName, true);
		$class_name_var = var_export($class_name, true);

		$class_name_prefix = rtrim(ucfirst($classname_prefix), "._");

		$properties2 = array();
		$js_properties2 = array();
		foreach ($properties as $k => $v) {
			$tmp = explode(' ', $v);
			$default = $defaults[$k];
			$comment = str_replace('*/', '**', $comments[$k]);
			$properties[$k] = <<<EOT
	$dc
	 * @property \${$tmp[1]}
	 * @type $tmp[0]
	 * @default $default
	 * $comment
	 */
EOT;
			$required = !$field_nulls[$k] && !isset($default);
			$properties2[$k] = $required
				? " * @param {".$tmp[0]."} \$fields.".$tmp[1]
				: " * @param {".$tmp[0]."} [\$fields.".$tmp[1]."] defaults to $default";
		}
		foreach ($js_properties as $k => $v) {
			$tmp = explode(' ', $v);
			$default = $js_defaults[$k];
			$comment = str_replace('*/', '**', $comments[$k]);
			$js_properties[$k] = <<<EOT
$dc
 * @property $tmp[1]
 * @type $tmp[0]
 * @default $default
 * $comment
 */
EOT;
			$required = !$field_nulls[$k] && !isset($default);
			$js_properties2[$k] = !empty($required)
				? " * @param {".$tmp[0]."} fields.".$tmp[1]
				: " * @param {".$tmp[0]."} [fields.".$tmp[1]."] defaults to $default";
		}
		$field_hints = implode("\n", $properties);
		$field_hints2 = implode("\n", $properties2);
		$js_field_hints = implode("\n", $js_properties);
		$js_field_hints2 = implode("\n", $js_properties2);
		
		// Here is the base class:
		$base_class_string = <<<EOT
<?php

$dc
 * Autogenerated base class representing $table_name_base rows
 * in the $connectionName database.
 *
 * Don't change this file, since it can be overwritten.
 * Instead, change the $class_name.php file.
 *
 * @module $connectionName
 */
$dc
 * Base class representing '$class_name_base' rows in the '$connectionName' database
 * @class Base_$class_name
 * @extends Db_Row
 *
 * @param {array} [\$fields=array()] The fields values to initialize table row as 
 * an associative array of \$column => \$value pairs
$field_hints2
 */
abstract class Base_$class_name extends Db_Row
{
$field_hints
	$dc
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	function setUp()
	{
		\$this->setDb(self::db());
		\$this->setTable(self::table());
		\$this->setPrimaryKey(
			$pk_exported_indented
		);
	}

	$dc
	 * Connects to database
	 * @method db
	 * @static
	 * @return {Db_Interface} The database object
	 */
	static function db()
	{
		return Db::connect($connectionName_var);
	}

	$dc
	 * Retrieve the table name to use in SQL statement
	 * @method table
	 * @static
	 * @param {boolean} [\$with_db_name=true] Indicates wheather table name should contain the database name
	 * @param {string} [\$alias=null] You can optionally provide an alias for the table to be used in queries
 	 * @return {string|Db_Expression} The table name as string optionally without database name if no table sharding
	 * was started or Db_Expression class with prefix and database name templates is table was sharded
	 */
	static function table(\$with_db_name = true, \$alias = null)
	{
		if (Q_Config::get('Db', 'connections', '$connectionName', 'indexes', '$class_name_base', false)) {
			return new Db_Expression((\$with_db_name ? '{{dbname}}.' : '').'{{prefix}}'.'$table_name_base');
		} else {
			\$conn = Db::getConnection($connectionName_var);
  			\$prefix = empty(\$conn['prefix']) ? '' : \$conn['prefix'];
  			\$table_name = \$prefix . '$table_name_base';
  			if (!\$with_db_name)
  				return \$table_name;
  			\$db = Db::connect($connectionName_var);
			\$alias = isset(\$alias) ? ' '.\$alias : '';
  			return \$db->dbName().'.'.\$table_name.\$alias;
		}
	}
	$dc
	 * The connection name for the class
	 * @method connectionName
	 * @static
	 * @return {string} The name of the connection
	 */
	static function connectionName()
	{
		return $connectionName_var;
	}

	$dc
	 * Create SELECT query to the class table
	 * @method select
	 * @static
	 * @param {string|array} [\$fields=null] The fields as strings, or array of alias=>field.
	 *   The default is to return all fields of the table.
	 * @param {string} [\$alias=null] Table alias.
	 * @return {Db_Query_Mysql} The generated query
	 */
	static function select(\$fields=null, \$alias = null)
	{
		if (!isset(\$fields)) {
			\$fieldNames = array();
			\$a = isset(\$alias) ? \$alias.'.' : '';
			foreach (self::fieldNames() as \$fn) {
				\$fieldNames[] = \$a .  \$fn;
			}
			\$fields = implode(',', \$fieldNames);
		}
		\$alias = isset(\$alias) ? ' '.\$alias : '';
		\$q = self::db()->select(\$fields, self::table(true, \$alias));
		\$q->className = $class_name_var;
		return \$q;
	}

	$dc
	 * Create UPDATE query to the class table
	 * @method update
	 * @static
	 * @param {string} [\$alias=null] Table alias
	 * @return {Db_Query_Mysql} The generated query
	 */
	static function update(\$alias = null)
	{
		\$alias = isset(\$alias) ? ' '.\$alias : '';
		\$q = self::db()->update(self::table(true, \$alias));
		\$q->className = $class_name_var;
		return \$q;
	}

	$dc
	 * Create DELETE query to the class table
	 * @method delete
	 * @static
	 * @param {string} [\$table_using=null] If set, adds a USING clause with this table
	 * @param {string} [\$alias=null] Table alias
	 * @return {Db_Query_Mysql} The generated query
	 */
	static function delete(\$table_using = null, \$alias = null)
	{
		\$alias = isset(\$alias) ? ' '.\$alias : '';
		\$q = self::db()->delete(self::table(true, \$alias), \$table_using);
		\$q->className = $class_name_var;
		return \$q;
	}

	$dc
	 * Create INSERT query to the class table
	 * @method insert
	 * @static
	 * @param {array} [\$fields=array()] The fields as an associative array of column => value pairs
	 * @param {string} [\$alias=null] Table alias
	 * @return {Db_Query_Mysql} The generated query
	 */
	static function insert(\$fields = array(), \$alias = null)
	{
		\$alias = isset(\$alias) ? ' '.\$alias : '';
		\$q = self::db()->insert(self::table(true, \$alias), \$fields);
		\$q->className = $class_name_var;
		return \$q;
	}
	
	$dc
	 * Inserts multiple rows into a single table, preparing the statement only once,
	 * and executes all the queries.
	 * @method insertManyAndExecute
	 * @static
	 * @param {array} [\$rows=array()] The array of rows to insert. 
	 * (The field names for the prepared statement are taken from the first row.)
	 * You cannot use Db_Expression objects here, because the function binds all parameters with PDO.
	 * @param {array} [\$options=array()]
	 *   An associative array of options, including:
	 *
	 * * "chunkSize" {integer} The number of rows to insert at a time. defaults to 20.<br>
	 * * "onDuplicateKeyUpdate" {array} You can put an array of fieldname => value pairs here,
	 * 		which will add an ON DUPLICATE KEY UPDATE clause to the query.
	 *
	 */
	static function insertManyAndExecute(\$rows = array(), \$options = array())
	{
		// simulate beforeSave on all rows
		foreach (\$rows as \$row) {
			if (is_array(\$row)) {
				\$rowObject = new $class_name(\$row);
			} else {
				\$rowObject = \$row;
				\$row = \$row->fields;
			}
			\$rowObject->beforeSave(\$row);
			\$row = \$rowObject->fields;
		}
		self::db()->insertManyAndExecute(
			self::table(), \$rows,
			array_merge(\$options, array('className' => $class_name_var))
		);
	}
	
	$dc
	 * Create raw query with begin clause
	 * You'll have to specify shards yourself when calling execute().
	 * @method begin
	 * @static
	 * @param {string} [\$lockType=null] First parameter to pass to query->begin() function
	 * @param {string} [\$transactionKey=null] Pass a transactionKey here to "resolve" a previously
	 *  executed that began a transaction with ->begin(). This is to guard against forgetting
	 *  to "resolve" a begin() query with a corresponding commit() or rollback() query
	 *  from code that knows about this transactionKey. Passing a transactionKey that doesn't
	 *  match the latest one on the transaction "stack" also generates an error.
	 *  Passing "*" here matches any transaction key that may have been on the top of the stack.
	 * @return {Db_Query_Mysql} The generated query
	 */
	static function begin(\$lockType = null, \$transactionKey = null)
	{
		\$q = self::db()->rawQuery('')->begin(\$lockType, \$transactionKey);
		\$q->className = $class_name_var;
		return \$q;
	}
	
	$dc
	 * Create raw query with commit clause
	 * You'll have to specify shards yourself when calling execute().
	 * @method commit
	 * @static
	 * @param {string} [\$transactionKey=null] Pass a transactionKey here to "resolve" a previously
	 *  executed that began a transaction with ->begin(). This is to guard against forgetting
	 *  to "resolve" a begin() query with a corresponding commit() or rollback() query
	 *  from code that knows about this transactionKey. Passing a transactionKey that doesn't
	 *  match the latest one on the transaction "stack" also generates an error.
	 *  Passing "*" here matches any transaction key that may have been on the top of the stack.
	 * @return {Db_Query_Mysql} The generated query
	 */
	static function commit(\$transactionKey = null)
	{
		\$q = self::db()->rawQuery('')->commit(\$transactionKey);
		\$q->className = $class_name_var;
		return \$q;
	}
	
	$dc
	 * Create raw query with rollback clause
	 * @method rollback
	 * @static
	 * @param {array} \$criteria Can be used to target the rollback to some shards.
	 *  Otherwise you'll have to specify shards yourself when calling execute().
	 * @return {Db_Query_Mysql} The generated query
	 */
	static function rollback()
	{
		\$q = self::db()->rawQuery('')->rollback();
		\$q->className = $class_name_var;
		return \$q;
	}
	
$functions_string
};
EOT;

		// Set the JS code
		$js_code = <<<EOT
$dc
 * Autogenerated base class representing $table_name_base rows
 * in the $connectionName database.
 *
 * Don't change this file, since it can be overwritten.
 * Instead, change the $class_name_prefix/$class_name_base.js file.
 *
 * @module $connectionName
 */

var Q = require('Q');
var Db = Q.require('Db');
var $connectionName = Q.require('$connectionName');
var Row = Q.require('Db/Row');

$dc
 * Base class representing '$class_name_base' rows in the '$connectionName' database
 * @namespace Base.$class_name_prefix
 * @class $class_name_base
 * @extends Db.Row
 * @constructor
 * @param {Object} [fields={}] The fields values to initialize table row as 
 * an associative array of {column: value} pairs
$js_field_hints2
 */
function Base (fields) {
	Base.constructors.apply(this, arguments);
}

Q.mixin(Base, Row);

$js_field_hints

$dc
 * This method calls Db.connect() using information stored in the configuration.
 * If this has already been called, then the same db object is returned.
 * @method db
 * @return {Db} The database connection
 */
Base.db = function () {
	return $connectionName.db();
};

$dc
 * Retrieve the table name to use in SQL statements
 * @method table
 * @param {boolean} [withoutDbName=false] Indicates wheather table name should contain the database name
 * @return {String|Db.Expression} The table name as string optionally without database name if no table sharding was started
 * or Db.Expression object with prefix and database name templates is table was sharded
 */
Base.table = function (withoutDbName) {
	if (Q.Config.get(['Db', 'connections', '$connectionName', 'indexes', '$class_name_base'], false)) {
		return new Db.Expression((withoutDbName ? '' : '{{dbname}}.')+'{{prefix}}$table_name_base');
	} else {
		var conn = Db.getConnection('$connectionName');
		var prefix = conn.prefix || '';
		var tableName = prefix + '$table_name_base';
		var dbname = Base.table.dbname;
		if (!dbname) {
			var dsn = Db.parseDsnString(conn['dsn']);
			dbname = Base.table.dbname = dsn.dbname;
		}
		return withoutDbName ? tableName : dbname + '.' + tableName;
	}
};

$dc
 * The connection name for the class
 * @method connectionName
 * @return {String} The name of the connection
 */
Base.connectionName = function() {
	return '$connectionName';
};

$dc
 * Create SELECT query to the class table
 * @method SELECT
 * @param {String|Object} [fields=null] The fields as strings, or object of {alias:field} pairs.
 *   The default is to return all fields of the table.
 * @param {String|Object} [alias=null] The tables as strings, or object of {alias:table} pairs.
 * @return {Db.Query.Mysql} The generated query
 */
Base.SELECT = function(fields, alias) {
	if (!fields) {
		fields = Base.fieldNames().map(function (fn) {
			return fn;
		}).join(',');
	}
	var q = Base.db().SELECT(fields, Base.table()+(alias ? ' '+alias : ''));
	q.className = '$class_name';
	return q;
};

$dc
 * Create UPDATE query to the class table. Use Db.Query.Mysql.set() method to define SET clause
 * @method UPDATE
 * @param {String} [alias=null] Table alias
 * @return {Db.Query.Mysql} The generated query
 */
Base.UPDATE = function(alias) {
	var q = Base.db().UPDATE(Base.table()+(alias ? ' '+alias : ''));
	q.className = '$class_name';
	return q;
};

$dc
 * Create DELETE query to the class table
 * @method DELETE
 * @param {Object}[table_using=null] If set, adds a USING clause with this table
 * @param {String} [alias=null] Table alias
 * @return {Db.Query.Mysql} The generated query
 */
Base.DELETE = function(table_using, alias) {
	var q = Base.db().DELETE(Base.table()+(alias ? ' '+alias : ''), table_using);
	q.className = '$class_name';
	return q;
};

$dc
 * Create INSERT query to the class table
 * @method INSERT
 * @param {Object} [fields={}] The fields as an associative array of {column: value} pairs
 * @param {String} [alias=null] Table alias
 * @return {Db.Query.Mysql} The generated query
 */
Base.INSERT = function(fields, alias) {
	var q = Base.db().INSERT(Base.table()+(alias ? ' '+alias : ''), fields || {});
	q.className = '$class_name';
	return q;
};

$dc
 * Create raw query with BEGIN clause.
 * You'll have to specify shards yourself when calling execute().
 * @method BEGIN
 * @param {string} [\$lockType] First parameter to pass to query.begin() function
 * @return {Db.Query.Mysql} The generated query
 */
Base.BEGIN = function(\$lockType) {
	var q = Base.db().rawQuery('').begin(\$lockType);
	q.className = '$class_name';
	return q;
};

$dc
 * Create raw query with COMMIT clause
 * You'll have to specify shards yourself when calling execute().
 * @method COMMIT
 * @return {Db.Query.Mysql} The generated query
 */
Base.COMMIT = function() {
	var q = Base.db().rawQuery('').commit();
	q.className = '$class_name';
	return q;
};

$dc
 * Create raw query with ROLLBACK clause
 * @method ROLLBACK
 * @param {Object} criteria can be used to target the query to some shards.
 *   Otherwise you'll have to specify shards yourself when calling execute().
 * @return {Db.Query.Mysql} The generated query
 */
Base.ROLLBACK = function(criteria) {
	var q = Base.db().rawQuery('').rollback(crieria);
	q.className = '$class_name';
	return q;
};

$dc
 * The name of the class
 * @property className
 * @type string
 */
Base.prototype.className = "$class_name";

// Instance methods

$dc
 * Create INSERT query to the class table
 * @method INSERT
 * @param {object} [fields={}] The fields as an associative array of {column: value} pairs
 * @param {string} [alias=null] Table alias
 * @return {Db.Query.Mysql} The generated query
 */
Base.prototype.setUp = function() {
	// does nothing for now
};

$dc
 * Create INSERT query to the class table
 * @method INSERT
 * @param {object} [fields={}] The fields as an associative array of {column: value} pairs
 * @param {string} [alias=null] Table alias
 * @return {Db.Query.Mysql} The generated query
 */
Base.prototype.db = function () {
	return Base.db();
};

$dc
 * Retrieve the table name to use in SQL statements
 * @method table
 * @param {boolean} [withoutDbName=false] Indicates wheather table name should contain the database name
 * @return {String|Db.Expression} The table name as string optionally without database name if no table sharding was started
 * or Db.Expression object with prefix and database name templates is table was sharded
 */
Base.prototype.table = function () {
	return Base.table();
};

$dc
 * Retrieves primary key fields names for class table
 * @method primaryKey
 * @return {string[]} An array of field names
 */
Base.prototype.primaryKey = function () {
	return $pk_json_indented;
};

$dc
 * Retrieves field names for class table
 * @method fieldNames
 * @return {array} An array of field names
 */
Base.prototype.fieldNames = function () {
	return Base.fieldNames();
};

$dc
 * Retrieves field names for class table
 * @method fieldNames
 * @static
 * @return {array} An array of field names
 */
Base.fieldNames = function () {
	return $field_names_json_indented;
};

$js_functions_string

module.exports = Base;
EOT;

		// Return the base class	
		return $base_class_string; // unless the above line threw an exception
	}
}
