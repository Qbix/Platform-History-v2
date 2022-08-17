<?php

/**
 * @module Db
 */

class Db_Result
{
	/**
	 * This class lets you use Db results from Db queries
	 * @class Db_Result
	 * @constructor
	 * @param {PDOStatement|array} $stmt The PDO statement object that this result uses
	 *  Can also be an array of PDO statements, in which case
	 *  this was the result of an aggregated query.
	 * @param {Db_Query_Interface} $query The query that was run to produce this result 
	 */
	function __construct ($stmt, Db_Query_Interface $query)
	{
		if (is_array($stmt)) {
			$this->stmts = $stmt;
			$this->stmt = isset($stmt[0]) ? $stmt[0] : null;
		} else {
			$this->stmt = $stmt;
		}
		$this->query = $query;
	}
	
	/**
	 * The PDO statement object that this result uses
	 * @property stmt
	 * @type PDOStatement
	 */
	public $stmt;
	
	/**
	 * An array of PDO statements if passed to the constructor
	 * @property $stmts
	 * @type array
	 */
	public $stmts;
	
	/**
	 * The query that was run to produce this result
	 * @property $query
	 * @type Db_Query_Mysql
	 */
	public $query;

	/**
	 * Fetches an array of database rows matching the query.
	 * The query is executed and fetchAll() is called on the result.
	 * 
	 * See [PDO documentation](http://us2.php.net/manual/en/pdostatement.fetchall.php)
	 * @method fetchAll
	 * @return {array}
	 */
	function fetchAll(
		$fetch_style = PDO::FETCH_BOTH, 
		$fetch_argument = null,
		array $ctor_args = array())
	{
		$arguments = func_get_args();
		if ($this->stmts) {
			$result = array();
			foreach ($this->stmts as $stmt) {
				$r = call_user_func_array(array($stmt, 'fetchAll'), $arguments);
				if ($r) {
					$result = array_merge($result, $r);
				}
			}
		} else {
			$result = call_user_func_array(array($this->stmt, 'fetchAll'), $arguments);
		}
		return $result;
	}
	
	/**
	 * Fetches an array of database rows matching the query.
	 * The query is executed and fetchAll() is called on the result.
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
		if (empty($fields_prefix)) {
			$fields_prefix = '';
		}
		if ($this->stmts) {
			$rows = array();
			foreach ($this->stmts as $stmt) {
				$r = $stmt->fetchAll(PDO::FETCH_ASSOC);
				if ($r) {
					$rows = array_merge($rows, $r);
				}
			}
		} else {
			$rows = $this->stmt->fetchAll(PDO::FETCH_ASSOC);
		}
		if (!empty($fields_prefix)) {
			$prefix_len = strlen($fields_prefix);
		}
		$result = array();
		foreach ($rows as $row) {
			if (!empty($fields_prefix)) {
				$row2 = array();
				foreach ($row as $key => $value) {
					if (strncmp($key, $fields_prefix, $prefix_len) != 0)
						continue;
					$row2[substr($key, $prefix_len)] = $value;
				}
				$row = $row2;
			}
			if ($by_field and isset($row[$by_field])) {
				$result[$row[$by_field]] = $row;
			} else {
				$result[] = $row;
			}
		}
		return $result;
	}

	/**
	 * Fetches an array of Db_Row objects (possibly extended).
	 * You can pass a prefix to strip from the field names.
	 * It will also filter the result.
	 * @method fetchDbRows
	 * @param {string} [$class_name=null] The name of the class to instantiate and fill objects from.
	 *  Must extend Db_Row. Defaults to $this->query->className
	 * @param {string} [$fields_prefix=''] This is the prefix, if any, to strip out when fetching the rows.
	 * @param {string} [$by_field=null] A field name to index the array by.
	 *  If the field's value is NULL in a given row, that row is just appended
	 *  in the usual way to the array.
	 * @return {array}
	 */
	function fetchDbRows (
		$class_name = null, 
		$fields_prefix = '',
		$by_field = null)
	{
		if (empty($fields_prefix)) {
			$fields_prefix = '';
		}
		if (empty($class_name) && isset($this->query)
		and !$this->query->getClause('JOIN')) {
			$class_name = $this->query->className;
		}
		if (empty($class_name)) {
			$class_name = 'Db_Row';
		}
		if ($class_name != 'Db_Row') {
			$parent_classes = class_parents($class_name);
			if (! in_array('Db_Row', $parent_classes)) {
				throw new Exception("Class $class_name does not extend Db_Row");
			}
		}
		
		// Build an array of Db_Row objects
		$rows = array();
		$arrs = $this->fetchAll(PDO::FETCH_ASSOC);
		foreach ($arrs as $arr) {
			$method = array($class_name, 'newRow');
			if (is_callable($method)) {
				$row = call_user_func($method, $arr, $fields_prefix);
			} else {
				$row = new $class_name(array(), false);
				$row->copyFrom($arr, $fields_prefix, false, false);
			}
			$row->init($this);
			if ($by_field and isset($row->$by_field)) {
				$rows[$row->$by_field] = $row;
			} else {
				$rows[] = $row;
			}
			$callback = array($row, "afterFetch");
			if (is_callable($callback)) {
				$row->afterFetch($this);
			}
		}
		
		return $rows;
	}
	
	/**
	 * Fetches one Db_Row object (possibly extended).
	 * You can pass a prefix to strip from the field names.
	 * It will also filter the result.
	 * @method fetchDbRow
	 * @param {string} [$class_name=null] The name of the class to instantiate and fill objects from.
	 *  Must extend Db_Row. Defaults to $this->query->className
	 * @param {string} [$fields_prefix=''] This is the prefix, if any, to strip out when fetching the rows.
	 * @return {Db_Row|boolean} Returns false if no row, otherwise returns an object of type $class_name
	 */
	function fetchDbRow(
		$class_name = null, 
		$fields_prefix = '')
	{
		if (empty($fields_prefix)) {
			$fields_prefix = '';
		}
		if (empty($class_name) and isset($this->query)
		and !$this->query->getClause('JOIN')) {
			$class_name = $this->query->className;
		}
		if (empty($class_name)) {
			$class_name = 'Db_Row';
		}
		if ($class_name != 'Db_Row') {
			$parent_classes = class_parents($class_name);
			if (! in_array('Db_Row', $parent_classes)) {
				throw new Exception("Class $class_name does not extend Db_Row");
			}
		}
		
		$arr = $this->fetch(PDO::FETCH_ASSOC);
		if (!$arr) {
			return false;
		}
		$method = array($class_name, 'newRow');
		if (is_callable($method)) {
			$row = call_user_func($method, $arr, $fields_prefix);
		} else {
			$row = new $class_name(array(), false);
			$row->copyFrom($arr, $fields_prefix, false, false);
		}
		$row->init($this);
		return $row;
	}

	/**
	 * Dumps the result as an HTML table. 
	 * Side effect, though: can't fetch anymore until the cursor is closed.
	 * @method __toMarkup
	 * @return {string}
	 */
	function __toMarkup ()
	{
		$return = "<table class='dbResultTable'>\n";
		
		try {
			$rows = $this->fetchAll(PDO::FETCH_ASSOC);
			$return .= "<tr class='heading'>\n";
			if (count($rows) > 0) {
				foreach ($rows[0] as $key => $value) {
					$return .= '<td>' . htmlentities($key) . '</td>' . "\n";
				}
			} else {
				return "<div class='dbResultTable'>Db_Result contains zero rows.</div>";
			}
			$return .= "</tr>\n";
			foreach ($rows as $row) {
				$return .= "<tr>\n";
				foreach ($row as $key => $value) {
					$return .= '<td>' . htmlentities($value) . '</td>' . "\n";
				}
				$return .= "</tr>\n";
			}
			$return .= "</table>";
			return $return;
		} catch (Exception $e) {
			return $e->getMessage();
		}
	}
	
	/**
	 * Dumps the result as a table in text mode
	 * Side effect, though: can't fetch anymore until the cursor is closed.
	 * @method __toString
	 * @return {string}
	 */
	function __toString ()
	{
		return "Db_Result";
		try {
			$ob = new Q_OutputBuffer();
			$rows = $this->fetchAll(PDO::FETCH_ASSOC);
			Db::dump_table($rows);
			return $ob->getClean();
		} catch (Exception $e) {
			return $e->getMessage();
		}
	}

	/**
	 * Forwards all other calls to the PDOStatement object
	 * @method __call
	 * @param {string} $name The function name
	 * @param {array} $arguments The arguments
	 */
	function __call ($name, array $arguments)
	{
		return call_user_func_array(array($this->stmt, $name), $arguments);
	}
}
;
