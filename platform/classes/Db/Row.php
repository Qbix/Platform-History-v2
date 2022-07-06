<?php

/**
 * @module Db
 */

class Db_Row
{
	/**
	 * This class lets you use Db rows and object-relational mapping functionality.
	 * 
	 * 
	 * Your model classes should extend this class. For example,
	 * class User extends Db_Row.
	 * 
	 * 
	 * When you extend this class, you can also implement the following callbacks.
	 * If they exist, Db_Row will call them at the appropriate time.
	 * <ul>
	 *  <li>
	 *     <b>setUp</b>
	 *     Called by the constructor to set up the information for
	 *     the fields and table relations.
	 *  </li>
	 *  <li>
	 *     <b>beforeRetrieve($search_criteria, $options)</b>
	 *     Called by retrieveOrSave() and retrieve() methods before retrieving a row.
	 *     $search_criteria is an associative array of modified fields and their values.
	 *     Return either an array of objects extending Db_Row, in which case no database SELECT is done,
	 *     or return the $search_criteria to use for the database search.
	 *     To totally cancel retrieval from the database, return null or an empty array.
	 *     Typically, you would use this function to retrieve from a cache, and call
	 *     calculatePKValue() to generate the key for the cache.
	 *  </li>
	 *  <li>
	 *     <b>afterFetch($result)</b>
	 *     Called by retrieveOrSave(), retrieve() and $result->fetchDbRows() methods after retrieving a row.
	 *     $result is the Db_Result, and $this is the Db_Row which was fetched
	 *  </li>
	 *  <li>
	 *     <b>beforeGetRelated($relationName, $fields, $inputs, $options)</b>
	 *     Called by getRelated method before trying to get related rows.
	 *     $relationName, $inputs and $fields are the parameters passed to getRelated.
	 *     If return value is set, then that is what getRelated returns immediately
	 *     after beforeGetRelated returns.
	 *     Typically, you would use this function to retrieve from a cache.
	 *  </li>
	 *  <li>
	 *     <b>beforeGetRelatedExecute($relationName, $query, $options)</b>
	 *     Called by getRelated() method before executing the Db_Query to get related rows.
	 *     It is passed the $relationName, the $query, and any options passed to getRelated().
	 *     This function should return the Db_Query to execute.
	 *  </li>
	 *  <li>
	 *     <b>beforeSave($modifiedFields)</b>
	 *     Called by save() method before saving the row.
	 *     $modified_values is an associative array of modified fields and their values.
	 *     Return the fields that should still be saved after beforeSave returns.
	 *     To cancel saving into the database, return null or an empty array.
	 *     If you've already run the query to save this row, return the query.
	 *     Typically, you would use this function to save into a cache, and call
	 *     calculatePKValue() to generate the key for the cache.
	 *  </li>
	 *  <li>
	 *     <b>beforeSaveExecute($query, $where)</b>
	 *     Called by save() method before executing the Db_Query to save.
	 *     It is passed the $query. This function should return the Db_Query to execute.
	 *     $where is an array if this is an update query, otherwise it is null.
	 *  </li>
	 *  <li>
	 *     <b>afterSaveExecute($result, $query, $modifiedFields, $where)</b>
	 *     Called by save() method after executing the Db_Query to save.
	 *     It is passed the $result. This function can analyze the result & take further action.
	 *     It should return the $result back to the caller.
	 *     $where is an array if this is an update query, otherwise it is null.
	 *  </li>
	 *  <li>
	 *     <b>beforeRemove($pk)</b>
	 *     Called by remove() method before saving the row.
	 *     $pk is an associative array representing the primary key of the row to delete.
	 *     Return a boolean indicating whether or not to delete.
	 *  </li>
	 *  <li>
	 *     <b>beforeRemoveExecute($query)</b>
	 *     Called by remove() method before executing the Db_Query to save.
	 *     It is passed the $query. This function should return the Db_Query to execute.
	 *  </li>
	 *  <li>
	 *     <b>afterRemoveExecute($result, $query)</b>
	 *     Called by remove() method after executing the Db_Query to save.
	 *     It is passed the $result and $query. This function can analyze the result & take further action.
	 *     It should return the $result back to the caller.
	 *  </li>
	 *  <li>
	 *     <b>beforeSet_$name($value)</b>
	 *     Called before the field named $name is set.
	 *     (Any illegal characters for function names are replaced with underscores)
	 *     Return <i>array($internal_name, $value)</i> of the field.
	 *     Handy when changing the name of the field inside the database layer,
	 *     as well as validating the value, etc.
	 *  </li>
	 *  <li>
	 *     <b>afterSet_$name($value)</b>
	 *     Called after the field named $name has been set.
	 *     (Any illegal characters for function names are replaced with underscores)
	 *  </li>
	 *  <li>
	 *     <b>afterSet($name, $value)</b>
	 *     Called after any field has been set, 
	 *     and after specific afterSet_$name was called.
	 *     Usually used to call things like notModified($name);
	 *  </li>
	 *  <li>
	 *     <b>beforeGet_$name()</b>
	 *     Called right before returning the name of the field called $name.
	 *     If it's defined, whatever this function returns, the user receives.
	 *     There is no real need for beforeGet($name) as a counterpart 
	 *     to beforeSet($name, $value), as there is no need to change the $name.
	 *     You can obtain the <i>value</i> of the field, and return it.
	 *  </li>
	 *  <li>
	 *     <b>isset_$name</b>
	 *     Called when checking if the field called $name is set and not null.
	 *     Return true or false.
	 *     Your function should probably make use of $this->fields directly here.
	 *  </li>
	 *  <li>
	 *     <b>unset_$name</b>
	 *     Called when someone wants to unset the field called $name. 
	 *     Your function should probably make use of $this->fields directly here.
	 *  </li>
	 * </ul>
	 * @class Db_Row
	 * @constructor
	 * @param {array} [$fields=array()] Here you can provide any fields to set on the row
	 *  right away.
	 * @param {boolean} [$doInit=true] Whether to initialize the row.
	 *  The reason this is here is that passing object arguments to the constructor 
	 *  by using PDOStatement::setFetchMode() causes a memory leak.
	 *  This is only set to false by Db_Result::fetchDbRows(),
	 *  which subsequently calls init() by itself.
	 *  As a user of this class, don't override this default value.
	 */
	function __construct ($fields = array(), $doInit = true)
	{
		if ($doInit) {
			$this->init();
		}
		if (!empty($fields)) {
			foreach ($fields as $k => $v) {
				$this->$k = $v;
			}
		}
	}

	/**
	 * Whether this Db_Row was inserted into the database or not.
	 * @property $inserted
	 * @type boolean
	 * @protected
	 */
	protected $inserted = false;

	/**
	 * Whether this Db_Row was retrieved from, or saved to the database.
	 * The save() method uses this to decide whether to insert or update.
	 * @property $retrieved
	 * @type boolean
	 * @protected
	 */
	protected $retrieved;
	
	/**
	 * The value of the primary key of the row
	 * Is set automatically if the Db_Row was fetched from a Db_Result.
	 * @property $pkValue
	 * @type array
	 * @protected
	 */
	protected $pkValue;
	
	/**
	 * Array of settings set up for a particular class
	 * that extends Db_Row.
	 * TODO: Can be abstracted into a DbTable class later.
	 * @property $setUp
	 * @type array
	 * @protected
	 */
	protected static $setUp;
	
	/**
	 * The fields of the row
	 * @property $fields
	 * @type array
	 */
	public $fields = array();
	
	/**
	 * Stores whether the fields were modified
	 * @property $fieldsModified
	 * @type array
	 * @protected
	 */
	protected $fieldsModified = array();

	/**
	 * The values of the fields before they were modified
	 * @property $fieldsOriginal
	 * @type array
	 * @protected
	 */
	public $fieldsOriginal = array();
	
	/**
	 * Used for setting and getting parameters on this Db_Row object
	 * which are not to be saved/retrieved to the db.
	 * @property $p
	 * @type Q_Tree
	 * @protected
	 */
	protected $p;

	/**
	 * Call this function to (re-)initialize the object.
	 * Typically should only be called from the constructor.
	 * @method init
	 * @param {Db_Result} [$result=null] The result that produced this row through fetchDbRows
	 */
	function init ($result = null)
	{
		$mySetUp = & $this->getSetUp();
		
		// Store whether this Db_Row was retrieved or not
		$this->retrieved = ! empty($result);
		
		// Set the default DB name, if needed and there
		if (empty($mySetUp['db'])) {
			if (!empty($result))
				if (!empty($result->query))
					$this->setDb($result->query->db);
		}
			
		// Set the default table name, if needed
		$class_name = get_class($this);
		if (empty($mySetUp['table'])) {
			$parts = explode('_', $class_name, 2);
			//$class_prefix = reset($parts);
			$table_name = end($parts);
			$table_name = strtolower($table_name);
			$this->setTable($table_name);
		}
		
		// Set up the default 'relations' and 'relations_many' arrays
		if (empty($mySetUp['relations']))
			$mySetUp['relations'] = array();
		if (empty($mySetUp['relations_many']))
			$mySetUp['relations_many'] = array();
		if (empty($mySetUp['relations_class_name']))
			$mySetUp['relations_class_name'] = array();
		if (empty($mySetUp['relations_alias']))
			$mySetUp['relations_alias'] = array();
		
		// Perform any other set-up!
		if (empty($mySetUp['setUp'])) {
			$callback = array($this, "setUp");
			if (is_callable($callback))
				call_user_func($callback);
			$mySetUp['setUp'] = true;
		}
		
		// Set the primary key, if this Db_Row came from a Db_Result
		if (! empty($result)) {
			$pk = $this->getPrimaryKey();
			if (is_array($pk)) {
				foreach ($pk as $fieldName) {
					if (!array_key_exists($fieldName, $this->fields)) {
						$get_class = get_class($this);
						$backtrace = debug_backtrace();
						$function = $line = $class = null;
						if (isset($backtrace[1]['function'])) {
							$function = $backtrace[1]['function'];
						}
						if (isset($backtrace[0]['line'])) {
							$line = $backtrace[0]['line'];
						}
						if (isset($backtrace[1]['class'])) {
							$class = $backtrace[1]['class'];
						}
						throw new Exception(
							"$get_class does not have $fieldName field set, "
							. "called in $class::$function (line $line)."
						);
					}
					$this->pkValue[$fieldName] = isset($this->fields[$fieldName])
						? $this->fields[$fieldName]
						: null;
				}
			}
		}
		
		// This record was just instantiated, so 
		// mark all fields as not modified.
		if (is_array($this->fields)) {
			foreach ($this->fields as $name => $value) {
				$this->fieldsModified[$name] = false;
			}
			$this->fieldsOriginal = $this->fields;
		}
	}
	
	/**
	 * Default implementation, does nothing
	 * @method setUp
	 */
	function setUp ()
	{
	
	}
	
	/**
	 * Converts joins to an array of relations
	 * Used by hasOne and hasMany.
	 * @method joinsToRelations
	 * @param {array} [$aliases=null] An associative array mapping aliases to class names.
	 *  Once set up, the aliases can be used in the join arrays instead of
	 *  the class names.
	 * @param {array} [$joins=array()] An array of associative arrays, which represent joins.
	 *  This is used internally, and has rules
	 *  described in hasOne and hasMany.
	 * @return {array} An array of relations that were generated
	 */
	protected static function joinsToRelations($aliases = null, $joins = array())
	{
		if (empty($aliases)) {
			$aliases = array();
		}
		
		$relations = array();
		foreach ($joins as $join) {
			if (empty($join)) {
				continue;
			}
			
			$join_r = array();
			$this_r = '__this_table';
			foreach ($join as $k => $v) {
				$k = str_replace('{$this}', $this_r, $k);
				$v = str_replace('{$this}', $this_r, $v);
				$join_r[$k] = $v;
			}
			
			$v = reset($join_r);
			$k = key($join_r);
			list($class1) = explode('.', $k, 2);
			list($class2) = explode('.', $v, 2);
			
			if (isset($aliases[$class1])) {
				$alias1 = $class1;
				$class1 = $aliases[$alias1];
				$table1 = ($class1 === $this_r)
					? $class1 
					: call_user_func(array($class1, 'table')) . ' ' . $alias1;
			} else {
				$table1 = ($class1 === $this_r)
					? $class1 
					: call_user_func(array($class1, 'table'));
			}
			if (isset($aliases[$class2])) {
				$alias2 = $class2;
				$class2 = $aliases[$alias2];
				$table2 = ($class2 === $this_r)
					? $class2
					: call_user_func(array($class2, 'table')) . ' ' . $alias2;
			} else {
				$table2 = ($class2 === $this_r)
					? $class2
					: call_user_func(array($class2, 'table'));
			}
			// Make a new Db_Relation with this info (join type: LEFT)
			$relations[] = new Db_Relation($table1, $join_r, $table2);
		}
		return $relations;
	}
	
	/**
	 * Set up a relation where at most one object is returned.
	 * For a more complex version, see hasOneEx.
	 * @method hasOne
	 * @param {string} $relationName The name of the relation. For example, "mother" or "primary_email"
	 * @param {array} $aliases, An associative array mapping aliases to class names.
	 *  Once set up, the aliases can be used in the join arrays instead of
	 *  the class names. 
	 *  The value of the last entry of this array is the name of the ORM class
	 *  that will hold each row of the result.
	 * @param {array} $join1 An array describing a relation between one table and another.
	 *  Each pair must be of the form "a.b" => "c.d", where a and c
	 *  are names of classes extending Db_Row, or their aliases from $aliases.
	 *  If a join array has more than one pair, the a and c must be the
	 *  same for each pair in the join array.
	 *
	 *  You can have as many of these as you want. A Db_Relation will be
	 *  built that will build a tree of these for you.
	 */
	function hasOne(
		$relationName,
		$aliases,
		$join1,
		$join2 = null)
	{	
		$args = func_get_args();
		array_unshift($args, get_class($this));
		call_user_func_array(array('Db_Row', 'hasOneFromClass'), $args);
	}
	
	/**
	 * Set up a relation where at most one object is returned.
	 * For a more complex version, see hasOneFromClassEx.
	 * @method hasOneFromClass
	 * @param {string} $from_class_name The name of the ORM class on which to set the relation
	 * @param {string} $relationName The name of the relation. For example, "mother" or "primary_email"
	 * @param {array} $aliases, An associative array mapping aliases to class names.
	 *  Once set up, the aliases can be used in the join arrays instead of
	 *  the class names. 
	 *  The value of the last entry of this array is the name of the ORM class
	 *  that will hold each row of the result.
	 * @param {array} $join1 An array describing a relation between one table and another.
	 *  Each pair must be of the form "a.b" => "c.d", where a and c
	 *  are names of classes extending Db_Row, or their aliases from $aliases.
	 *  If a join array has more than one pair, the a and c must be the
	 *  same for each pair in the join array.
	 *  The keys of the arrays (i.e. the string on the left-hand side)
	 *  must refer to tables which have already been mentioned previously
	 *  in either a key or a value.
	 *  The first key of the first join array must start with the alias '&#123;$this&#125;'
	 *  which basically refers to the table corresponding to the Db_Row on which
	 *  this method was called. For example, '&#123;$this&#125;.name' => 'subscription.streamName'
	 *
	 *  You can have as many of these as you want. A Db_Relation will be
	 *  built that will build a tree of these for you.
	 */
	static function hasOneFromClass(
		$class_name,
		$relationName,
		$aliases,
		$join1,
		$join2 = null)
	{	
		// Build the relations to pass to hasOneFromClassEx
		$relations = self::joinsToRelations($aliases, array_slice(func_get_args(), 3));
		$to_class_name = end($aliases);

		$params = array(
			$class_name,
			$relationName,
			$to_class_name,
			'__this_table',
		);
		$params = array_merge($params, $relations);
		call_user_func_array(array('Db_Row', 'hasOneFromClassEx'), $params);
	}

	/**
	 * Set up a relation where at most one object is returned.
	 * @method hasOneEx
	 * @param {string} $relationName The name of the relation. For example, "mother" or "primary_email"
	 * @param {string} $to_class_name The name of the ORM class which extends Db_Row, to load the result into.
	 * @param {string} $alias The table name or alias that will refer to the table in the query
	 *  corresponding to $this object.
	 * @param {Db_Relation} $relation The relation between two or more tables, or the table
	 *  with itself.
	 * 
	 *  You can pass as many Db_Relations as necessary and they are combined
	 *  using Db_Relation's constructor.
	 *  The only valid relations are the ones
	 *  which have a single root foreign_table.
	 */
	function hasOneEx (
		$relationName, 
		$to_class_name, 
		$alias, 
		Db_Relation $relation, 
		Db_Relation $relation2 = null)
	{
		$args = func_get_args();
		array_unshift($args, get_class($this));
		call_user_func_array(array('Db_Row', 'hasOneFromClassEx'), $args);
	}

	
	/**
	 * Sets up a relation where an array is returned.
	 * For a more complex version, see hasManyEx.
	 * @method hasMany
	 * @param {string} $relationName The name of the relation. For example, "tags" or  "reviews"
	 * @param {array} $aliases An associative array mapping aliases to class names.
	 *  Once set up, the aliases can be used in the join arrays instead of
	 *  the class names. 
	 *  The value of the last entry of this array is the name of the ORM class
	 *  that will hold each row of the result.
	 * @param {array} $join1 An array describing a relation between one table and another.
	 *  Each pair must be of the form "a.b" => "c.d", where a and c
	 *  are names of classes extending Db_Row, or their aliases from $aliases.
	 *  If a join array has more than one pair, the a and c must be the
	 *  same for each pair in the join array.
	 *  The keys of the arrays (i.e. the string on the left-hand side)
	 *  must refer to tables which have already been mentioned previously
	 *  in either a key or a value.
	 *  The first key of the first join array must start with the alias '&#123;$this&#125;'
	 *  which basically refers to the table corresponding to the Db_Row on which
	 *  this method was called. For example, '&#123;$this&#125;.name' => 'subscription.streamName'<br/>
	 *
	 *  You can have as many of these as you want. A Db_Relation will be
	 *  built that will build a tree of these for you.
	 */
	function hasMany(
		$relationName,
		$aliases,
		$join1,
		$join2 = null)
	{	
		$args = func_get_args();
		array_unshift($args, get_class($this));
		call_user_func_array(array('Db_Row', 'hasManyFromClass'), $args);
	}
	
	/**
	 * Sets up a relation where an array is returned.
	 * For a more complex version, see hasManyFromClassEx.
	 * @method hasManyFromClass
	 * @param {string} $from_class_name The name of the ORM class on which to set the relation
	 * @param {string} $relationName The name of the relation. For example, "tags" or  "reviews"
	 * @param {array} $aliases, An associative array mapping aliases to class names.
	 *  Once set up, the aliases can be used in the join arrays instead of
	 *  the class names. 
	 *  The value of the last entry of this array is the name of the ORM class
	 *  that will hold each row of the result.
	 * @param {array} $join1 An array describing a relation between one table and another.
	 *  Each pair must be of the form "a.b" => "c.d", where a and c
	 *  are names of classes extending Db_Row, or their aliases from $aliases.
	 *  If a join array has more than one pair, the a and c must be the
	 *  same for each pair in the join array.
	 *
	 *  You can have as many of these as you want. A Db_Relation will be
	 *  built that will build a tree of these for you.
	 */
	static function hasManyFromClass(
		$class_name,
		$relationName,
		$aliases,
		$join1,
		$join2 = null)
	{	
		// Build the relations to pass to hasManyFromClassEx
		$relations = self::joinsToRelations($aliases, array_slice(func_get_args(), 3));
		$to_class_name = end($aliases);

		$params = array(
			$class_name,
			$relationName,
			$to_class_name,
			'__this_table',
		);
		$params = array_merge($params, $relations);
		call_user_func_array(array('Db_Row', 'hasManyFromClassEx'), $params);
	}
	
	/**
	 * Set up a relation where an array is returned.
	 * @method hasManyEx
	 * @param {string} $relationName The name of the relation. For example, "tags" or  "reviews"
	 * @param {string} $to_class_name The name of the ORM class which extends Db_Row, to load the result into.
	 * @param {string} $alias The table name or alias that will refer to the table in the query
	 *  corresponding to $this object.
	 * @param {Db_Relation} $relation The relation between two or more tables, or the table with itself.
	 *
	 * You can pass as many Db_Relations as necessary and they are combined
	 * using Db_Relation's constructor.
	 * The only valid relations are the ones which have a single root foreign_table.
	 */
	function hasManyEx (
		$relationName, 
		$to_class_name, 
		$alias, 
		Db_Relation $relation, 
		Db_Relation $relation2 = null)
	{
		$args = func_get_args();
		array_unshift($args, get_class($this));
		call_user_func_array(array('Db_Row', 'hasManyFromClassEx'), $args);
	}

	/**
	 * Set up a relation where at most one object is returned.
	 * @method hasOneFromClassEx
	 * @param {string} $from_class_name The name of the ORM class on which to set the relation
	 * @param {string} $relationName The name of the relation. For example, "Mother" or  "Primary Email"
	 * @param {string} $to_class_name The name of the ORM class which extends Db_Row, to load the result into.
	 * @param {string} $alias The table name or alias that will refer to the table in the query
	 *  corresponding to $this object.
	 * @param {Db_Relation} $relation The relation between two or more tables, or the table with itself.
	 *
	 * You can pass as many Db_Relations as necessary and they are combined
	 * using Db_Relation's constructor.
	 * The only valid relations are the ones which have a single root foreign_table.
	 */
	static function hasOneFromClassEx (
		$from_class_name,
		$relationName, 
		$to_class_name, 
		$alias, 
		Db_Relation $relation, 
		Db_Relation $relation2 = null)
	{
		$args = func_get_args();
		$count = count($args);
		$relations = array();
		for ($i = 4; $i < $count; ++ $i)
			$relations[] = $args[$i];
		$relation = new Db_Relation($relations);

		// Add the relations
		$mySetUp = & self::getSetUpFromClass($from_class_name);
		$mySetUp['relations'][$relationName] = $relation;
		$mySetUp['relations_many'][$relationName] = false;
		$mySetUp['relations_class_name'][$relationName] = $to_class_name;
		$mySetUp['relations_alias'][$relationName] = $alias;
	}

	/**
	 * Set up a relation for another table, where an array is returned.
	 * @method hasManyFromClassEx
	 * @param {string} $from_class_name The name of the ORM class on which to set the relation
	 * @param {string} $relationName The name of the relation. For example, "Tags" or  "Reviews"
	 * @param {string} $to_class_name The name of the ORM class which extends Db_Row, to load the result into.
	 * @param {string} $alias The table name or alias that will refer to the table in the query corresponding to the other object.
	 * @param {Db_Relation} $relation The relation between two or more tables, or the table with itself.
	 *
	 * You can pass as many Db_Relations as necessary and they are combined
	 * using Db_Relation's constructor.
	 * The only valid relations are the ones
	 * which have a single root foreign_table, with a
	 * foreign_class_name specified. That is the class of the
	 * object created when getRelated(...) is called.
	 */
	static function hasManyFromClassEx (
		$from_class_name,
		$relationName, 
		$to_class_name,
		$from_alias, 
		Db_Relation $relation, 
		Db_Relation $relation2 = null)
	{
		$args = func_get_args();
		$count = count($args);
		$relations = array();
		for ($i = 4; $i < $count; ++ $i)
			$relations[] = $args[$i];
		$relation = new Db_Relation($relations);

		// Add the relations
		if (! isset(self::$setUp[$from_class_name]))
			self::$setUp[$from_class_name] = array();
		$mySetUp =& self::$setUp[$from_class_name];
		$mySetUp['relations'][$relationName] = $relation;
		$mySetUp['relations_many'][$relationName] = true;
		$mySetUp['relations_class_name'][$relationName] = $to_class_name;
		$mySetUp['relations_alias'][$relationName] = $from_alias;
	}

	/**
	 * Returns whether this Db_Row contains information retrieved from the database,
	 * or saved to the database.
	 * @method wasRetrieved
	 * @param {boolean} [$new_value=null] If set, then this function sets the "retrieved" status to the new value.
	 *  Otherwise, it just gets the "retrieved" status of the row.
	 * @return {boolean} Whether the row is marked as retrieved from the Db.
	 */
	function wasRetrieved ($new_value = null)
	{
		if (isset($new_value)) {
			$this->retrieved = $new_value;
		}
		return $this->retrieved;
	}

	/**
	 * Returns whether this Db_Row was inserted into the database.
	 * @method wasInserted
	 * @param {boolean} [$new_value=null] If set, then this function sets the "inserted" status to the new value.
	 *  Otherwise, it just gets the "retrieved" status of the row.
	 * @return {boolean} Whether the row is marked as inserted into the Db.
	 */
	function wasInserted ($new_value = null)
	{
		if (isset($new_value)) {
			$this->inserted = $new_value;
		}
		return $this->inserted;
	}


	/**
	 * Marks a particular field as not modified since retrieval or creation of the object.
	 * @method notModified
	 * @param {string} $fieldName The name of the field
	 * @return {boolean} Whether the field with that name was modified in the first place.
	 */
	function notModified ($fieldName)
	{
		if (empty($this->fieldsModified[$fieldName])) {
			return false;
		}
		$this->fieldsModified[$fieldName] = false;
		return true;
	}

	/**
	 * Returns whether a particular field was modified since retrieval or creation of the object.
	 * @method wasModified
	 * @param {string} [$fieldName=null] The name of the field.
	 *  You can also pass false here to mark the whole row unmodified.
	 * @param {boolean} [$evenIfValuesDidntChange=false]
	 * @return {boolean} Whether the field with that name was modified in the first place.
	 */
	function wasModified ($fieldName = null, $evenIfValuesDidntChange = false)
	{
		if ($fieldName === false) {
			if (is_array($this->fields)) {
				foreach ($this->fields as $name => $value) {
					$this->fieldsModified[$name] = false;
				}
			}
			$this->fieldsOriginal = $this->fields;
			return;
		}
		if (!isset($fieldName)) {
			foreach ($this->fieldsModified as $key => $value) {
				if (!empty($value)) {
					if ($evenIfValuesDidntChange
					or $this->fieldsOriginal[$key] !== $this->fields[$key]) {
						return true;
					}
				}
			}
			return false;
		}
		return !empty($this->fieldsModified[$fieldName]);
	}

	/**
	 * Returns array of all the fields which were modified, and their new value
	 * @method modifiedFields
	 * @return {array} Associative array consisting of $fieldname => $value pairs.
	 */
	function modifiedFields ()
	{
		$result = array();
		foreach ($this->fieldsModified as $field => $modified) {
			if ($modified) $result[$field] = $this->fields[$field];
		}
		return $result;
	}

	/**
	 * Gets the primary key of the table
	 * @method getPrimaryKey
	 * @return {array} An array naming all the fields that comprise the
	 *  primary key index, in the order they appear in the key.
	 */
	function getPrimaryKey ()
	{
		$mySetUp = $this->getSetUp();
		return isset($mySetUp['primaryKey']) ? $mySetUp['primaryKey'] : null;
	}

	/**
	 * Sets up the primary key of the table
	 * @method setPrimaryKey
	 * @param {array} $primaryKey An array naming all the fields that comprise the
	 *  primary key index, in the order they appear in the key.
	 */
	function setPrimaryKey (array $primaryKey)
	{
		$mySetUp = & $this->getSetUp();
		$mySetUp['primaryKey'] = $primaryKey;
	}

	/**
	 * Sets the database to operate on
	 * @method setDb
	 * @param {Db_Interface} $db
	 */
	public function setDb (Db_Interface $db)
	{
		$mySetUp = & $this->getSetUp();
		$mySetUp['db'] = $db;
	}

	
	/**
	 * Gets the SetUp for this object's class
	 * @method getSetUp
	 * @return {&array} the setUp array
	 */
	function &getSetUp ()
	{
		$class_name = get_class($this);

		if (! isset(self::$setUp[$class_name]))
			self::$setUp[$class_name] = array();
		
		return self::$setUp[$class_name];		
	}
	
	/**
	 * Gets the setUp for a class
	 * @method getSetUpFromClass
	 * @static
	 * @param {string} $class_name
	 * @return {&array} the setUp array
	 */
	static function &getSetUpFromClass($class_name)
	{
		if (! isset(self::$setUp[$class_name]))
			self::$setUp[$class_name] = array();
		
		return self::$setUp[$class_name];
	}

	/**
	 * Gets the database to operate on, associated with this row
	 * @method getDb
	 * @return {Db_Mysql}
	 */
	function getDb ()
	{
		$mySetUp = $this->getSetUp();
		return isset($mySetUp['db']) ? $mySetUp['db'] : false;
	}

	/**
	 * Gets the database to operateon, associated with this row
	 * @method getDbFromClassName
	 * @return {Db}
	 */
	static function getDbFromClassName ($class_name)
	{
		if (! isset(self::$setUp[$class_name]))
			self::$setUp[$class_name] = array();
		$mySetUp = self::$setUp[$class_name];
		return isset($mySetUp['db']) ? $mySetUp['db'] : false;
	}

	/**
	 * Sets the table to operate on 
	 * @method setTable
	 * @param {string} $table_name
	 */
	public function setTable ($table_name)
	{
		$mySetUp = & $this->getSetUp();
		$mySetUp['table'] = $table_name;
	}

	/**
	 * Gets the table that was set to operate on
	 * @method getTable
	 * @return {string}
	 */
	function getTable ()
	{
		$mySetUp = $this->getSetUp();
		return $mySetUp['table'];
	}

	/**
	 * Gets the primary key's value for this record, if it was retrieved.
	 * If the record was not retrieved, the primary key's value should be empty.
	 * @method getPKValue
	 * @return {array} An associative array with keys being all the fields that comprise the
	 *  primary key index, in the order they appear in the key.
	 *  The values are the values at the time the record was retrieved.
	 */
	function getPKValue ()
	{
		return $this->pkValue;
	}

	/**
	 * Calculate the primary key's value for this record
	 * Different from getPKValue in that it returns the CURRENT
	 * values of all the fields named in the primary key index.
	 * This can be called even if the Db_Row was not retrieved,
	 * and typically is used for caching purposes.
	 * @method calculatePKValue
	 * @return {array|false} An associative array naming all the fields that comprise the
	 *  primary key index, in the order they appear in the key.<br/>
	 *	Returns false if even one of the fields comprising the primary key is not set.
	 */
	function calculatePKValue ()
	{
		$return = array();
		$pk = $this->getPrimaryKey();
		foreach ($pk as $fieldName) {
			if (!array_key_exists($fieldName, $this->fields)) {
				return false;
			}
			$return[$fieldName] = $this->$fieldName;
		}
		return $return;
	}

	/**
	 * Sets the primary key's value for this record.
	 * You should really call this only on Db_Row objects
	 * that were not extended by another class.
	 * @method setPKValue
	 * @param {array} $new_pk_value
	 * @throws {Exception} If passed parameter is not array
	 */
	function setPKValue ($new_pk_value)
	{
		if (! is_array($new_pk_value))
			throw new Exception("setPKValue expects an array", - 1);
		$this->pkValue = $new_pk_value;
	}

	/**
	 * Sets a column in the row
	 * @method __set
	 * @param {string} $name
	 * @param {mixed} $value
	 */
	function __set ($name, $value)
	{
		$name_internal = $name;
		$name_safe = preg_replace('/[^0-9a-zA-Z\_]/', '_', $name);
		
		$callback = array($this, "beforeSet_$name_safe");
		if (is_callable($callback)) {
			list ($name_internal, $value) = call_user_func($callback, $value);
		}

		if (!isset($this->fieldsOriginal[$name_internal])) {
			$this->fieldsOriginal[$name_internal] = Q::ifset($this->fields, $name_internal, null);
		}
		$this->fields[$name_internal] = $value;
		$this->fieldsModified[$name_internal] = true;
		
		$callback = array($this, "afterSet_$name_safe");
		if (is_callable($callback)) {
			$value = call_user_func($callback, $value);
		}

		$callback = array($this, "afterSet");
		if (is_callable($callback)) {
			call_user_func($callback, $name, $value);
		}
	}

	/**
	 * Gets a column in the row
	 * @method __get
	 * @param {string} $name
	 * @return {mixed}
	 */
	function __get ($name)
	{
		$callback = array($this, "beforeGet_$name");
		if (is_callable($callback)) {
			return call_user_func($callback);
		}
		if (array_key_exists($name, $this->fields)) {
			return $this->fields[$name]; 
		}
		$get_class = get_class($this);
		$backtrace = debug_backtrace();
		$function = $line = $class = null;
		if (isset($backtrace[1]['function'])) {
			$function = $backtrace[1]['function'];
		}
		if (isset($backtrace[0]['line'])) {
			$line = $backtrace[0]['line'];
		}
		if (isset($backtrace[1]['class'])) {
			$class = $backtrace[1]['class'];
		}
		throw new Exception(
			"$get_class does not have $name field set, "
			. "called in $class::$function (line $line)."
		);
		return null;
	}

	/**
	 * Returns whether a column in the row is set
	 * @method __isset
	 * @param {string} $name
	 * @return {mixed}
	 */
	function __isset ($name)
	{
		$callback = array($this, "isset_$name");
		if (is_callable($callback))
			return call_user_func($callback);
		return isset($this->fields[$name]);
	}

	/**
	 * Unsets a column in the row.
	 * This only affects the PHP object, not the database record.
	 * If the PHP object is saved, it simply does not affect that column in the database.
	 * @method __unset
	 * @param {string} $name
	 */
	function __unset ($name)
	{
		$callback = array($this, "unset_$name"
		);
		if (is_callable($callback)) {
			call_user_func($callback);
		} else {
			unset($this->fields[$name]);
		}
	}

	/**
	 * Get some records in a related table using foreign keys
	 * @method getRelated
	 * @param {string} $relationName The name of the relation, or the name of 
	 *  a class, which extends Db_Row, representing the foreign table.
	 *  We use the relations set up, in $this->getSetUp(),
	 *  through the use of Db_Row::hasOne() and Db_Row::hasMeny().
	 * @param {string} [$fields=array()] The fields to return
	 * @param {array} [$inputs=array()]
	 *  An associative array of table_alias => DbRecord pairs.
	 *  If you think of foreign tables as parent nodes, then the relation
	 *  is a tree that has as its root, the table you want to return.
	 *  The relation determines the joins between the tables, but
	 *  you may want to specify the "input records" to limit the results
	 *  using the WHERE clause. Here is an example:
	 * @example
	 * 	 // Assume the relation "Tags" had specified the following tree:
	 * 	 // user_item_tag
	 * 	 // |
	 * 	 // - user
	 * 	 // - item
	 * 	
	 * 	 // Return all the tags this $user has placed on this $item.
	 * 	  $user->getRelated('tags', array('i' => $item));
	 * 	 // Return all the tags this $user has placed on all items.
	 * 	 // Note, however, that only the Tag record portion is returned,
	 * 	 // even though the Items table is still joined onto it.
	 * 	  $user->getRelated('tags');
	 *
	 * @param {boolean} [$modifyQuery=false] If true, returns a Db_Query object that can be modified, rather than
	 *  the result. You can call more methods, like limit, offset, where, orderBy,
	 *  and so forth, on that Db_Query. After you have modified it sufficiently,
	 *  get the ultimate result of this function, by calling the resume() method on 
	 *  the Db_Query object (via the chainable interface).
	 * @param {array} $options=array() Array of options to pass to beforeGetRelated and beforeGetRelatedExecute functions.
	 * @return {array|Db_Row|false} If the relation was defined with hasMany, returns an array of db rows.
	 *  If the relation was defined with hasOne, returns a db row or false. 
	 */
	function getRelated (
		$relationName, 
		$fields = array(),
		$inputs = array(),
		$modifyQuery = false,
		$options = array())
	{
		if (empty($inputs))
			$inputs = array();
		
		if (empty($fields))
			$fields = array();
		
		$mySetUp = & $this->getSetUp();
		if (! isset($mySetUp['relations'][$relationName])) {
			throw new Exception("Relation $relationName not found.");
		}
		if (! isset($mySetUp['relations_many'][$relationName])) {
			throw new Exception(
				"Information on relation $relationName not found."
			);
		}
		
		$callback = array($this, "beforeGetRelated");
		if (is_callable($callback)) {
			$result = call_user_func($callback, $relationName, $fields, $inputs);
		}
		if (isset($result))
			return $result;
		
//		$inputs_string = '';
//		foreach ($inputs as $key => $value) {
//			$inputs_string .= $key;
//			foreach ($value as $v)
//				$inputs_string .= $v;
//		}
		
		$mySetUp = & $this->getSetUp();
		$relation = $mySetUp['relations'][$relationName];
		$many = $mySetUp['relations_many'][$relationName];
		$class_name = $mySetUp['relations_class_name'][$relationName];
		$alias = $mySetUp['relations_alias'][$relationName];
		$root_table = $relation->getRootTable();

		$inputs[$alias] = $this; // This object should always be one of the inputs

		$db = $this->getDb();
		if (empty($db))
			throw new Exception("The database was not specified!");
			
		$connection_name = $db->connectionName();
		
		$pieces = explode(' ', $root_table);
		//$table2 = $pieces[0];
		$has_alias = (count($pieces) > 1) and end($pieces);
		$alias2 = $has_alias ? end($pieces) : reset($pieces);
		
		// Try to be accomodating:
		if (is_string($fields)) {
			$fields = array($alias2 => $fields);
		}
		
		//$root_table_fields_prefix = null;
		if (! isset($fields[$alias2])) {
			if (class_exists($class_name)) {
				if (method_exists($class_name, 'fieldNames')) {
					$callable = array($class_name, 'fieldNames');
					$table_fields = call_user_func($callable, $alias2, $alias2 . '_');
					$fields[$alias2] = $table_fields;
					$root_table_fields_prefix = $alias2 . '_';
				} else {
					$fields[$alias2] = "$alias2.*";
				}
			}
		}
		
		if (empty($fields[$alias2]))
			$fields[$alias2] = '*';
			
		$query = $db->select($fields[$alias2], $root_table);

		//static $alias_counter = 0;
		$non_root_aliases = array();
		$skipped_aliases = array();
		for ($i=1; $i < 100; ++$i) {
			$level = $relation->getLevel($i);
			if (empty($level))
				break;
			foreach ($level as $r) {
				foreach ($inputs as $alias => $row) {
					$table = $row->getTable();
					$key = ($table == $alias) ? $table : "$table $alias";
					if ($key == $r->table
					or "$table AS $alias" == $r->table
					or "$table as $alias" == $r->table
					or "$alias" == $r->table) {
						$skipped_aliases[$alias] = true;
						continue 2; // do not join inputted tables
					}
				}
				$query->join($r->table, $r->foreign_key, $r->join_type);

				$pieces = explode(' ', $r->table);
				$table3 = $pieces[0];
				$has_alias = (count($pieces) > 1) and end($pieces);
				$alias3 = ! empty($has_alias) ? end($pieces) : $pieces[0];
				$table_class_name = Db::generateTableClassName($table3, $connection_name);
				if (isset($fields[$alias3])) {
					if ($fields[$alias3] === true) {
						if (class_exists($table_class_name)) {
							if (method_exists($table_class_name, 'fieldNames')) {
								$callable = array($table_class_name, 'fieldNames');
								$table_fields = call_user_func(
									$callable, $alias3, $alias3 . '_'
								);
								$query->select($table_fields, null);
							} else {
								$query->select("$alias3.*", null);
							}
						} else {
							$query->select("$alias3.*", null);
						}
					} else {
						$query->select($fields[$alias3], null);
					}
					$non_root_aliases[$alias3] = true;
				}
			}
		}
		$relations = $relation->getRelations();
		
		// Fill out the where clause
		foreach ($inputs as $alias => $row) {
			$table = $row->getTable();
			if (isset($relations["$table $alias"])) {
				$r = $relations["$table $alias"];
			} else if (isset($relations["$table AS $alias"])) {
				$r = $relations["$table AS $alias"];
			} else if (isset($relations["$table as $alias"])) {
				$r = $relations["$table as $alias"];
			} else if (isset($relations["$alias"])) {
				$r = $relations["$alias"];
			} else {
				throw new Exception("No table corresponding to '$table $alias' in relation", -1);
			}
			$where_fields = array_flip($r->foreign_key);
			foreach ($where_fields as $k => $v) {
				$exploded = explode(' ', $k, 2);
				$pieces = end($exploded);
				$exploded2 =
				$a = reset();
				if (isset($skipped_aliases[$a])) {
					continue 2; // do not have conditions for tables that were not joined
				}
				$pieces = explode('.', $v, 2);
				$fieldName = end($pieces);
				$where_fields[$k] = $row->$fieldName;
			}
			$query->where($where_fields);
		}
		
		// Set the class to be returned
		$query->className = $mySetUp['relations_class_name'][$relationName];
		
		// Perhaps the extending class wants to do something else with this query
		// before it is executed
		$callback = array($this, "beforeGetRelatedExecute", $options);
		if (is_callable($callback))
			$query = call_user_func($callback, $relationName, $query);
		if (empty($query))
			return false;
			
		// Gather all the arguments together for getRelated_resume() method
		$resume_args = array(
			$relationName, $fields, $inputs,
			$modifyQuery, $options
		);
		$resume_args[] = @compact(
			'many', 'options',
			'class_name', 'root_table_fields_prefix', 'non_root_aliases'
		);
		
		// Modify the query if necessary
		if ($modifyQuery) {
			$query->setContext(array($this, 'getRelated'), $resume_args);
			return $query;
		}

		// Return the result
		$resume_args[] = $query;
		return call_user_func_array(array($this, 'getRelated_resume'), $resume_args);
	}
	
	function getRelated_resume (
		$relationName, 
		$fields = array(),
		$inputs = array(),
		$modifyQuery = false,
		$options = array(),
		$preserved_vars = array(),
		$query = null)
	{
		// Resumes getRelated() function, possibly after
		// the intermediate query executes.
		extract($preserved_vars);

		/* @var $class_name */
		/* @var $root_table_fields_prefix */
		/* @var $many */
		/* @var $non_root_aliases */
		if (!isset($class_name) or $class_name == 'Db_Row' or $non_root_aliases) {
			
			$rows = $query->fetchDbRows('Db_Row');

		} else {

			if (!isset($root_table_fields_prefix)) {
				$root_table_fields_prefix = '';
			}
			$rows_array = $query->fetchAll(PDO::FETCH_ASSOC);
			$rows = array();
			foreach ($rows_array as $row_array) {
				$method = array($class_name, 'newRow');
				if (is_callable($method)) {
					$row = call_user_func($method, $row_array, $root_table_fields_prefix);
				} else {
					$row = new $class_name();
					$row->copyFrom($row_array, $root_table_fields_prefix, false, false);
				}
				$row->retrieved = true;
				foreach ($row->fieldsModified as $key => $value) {
					$row->fieldsModified[$key] = false;
				}
				$row->fieldsOriginal = $row->fields;
				$pk = array();
				foreach ($row->getPrimaryKey() as $field) {
					$pk[$field] = $row->$field;
				}
				// FIXME
				/* @var $row Db_Row */
				$row->setPkValue($pk);
				$rows[] = $row;
			}

		}

		if ($many) {
			$return = $rows;
		} else {
			$return = count($rows) > 0 ? $rows[0] : false;
		}
			
		//$mySetUp['relations_cache'][$hash] = $return;

		return $return;
	}

	/**
	 * Gets the value of a field
	 * @method get
	 * @param {string} $key1 The name of the first key in the configuration path
	 * @param {string} $key2 Optional. The name of the second key in the configuration path.
	 *  You can actually pass as many keys as you need,
	 *  delving deeper and deeper into the configuration structure.
	 *  All but the last parameter are interpreted as keys.
	 * @param {mixed} $default Unless only one key is passed, the last parameter
	 *  is the default value to return in case the requested field was not found.
	 */
	function get(
	 $key1,
	 $default = null)
	{
		$args = func_get_args();
		if (!isset($this->p)) {
			$this->p = new Q_Tree;
		}
		return call_user_func_array(array($this->p, __FUNCTION__), $args);
	}
	
	/**
	 * Sets the value of a field
	 * @method set
	 * @param {string} $key1 The name of the first key in the configuration path
	 * @param {string} $key2 Optional. The name of the second key in the configuration path.
	 *  You can actually pass as many keys as you need,
	 *  delving deeper and deeper into the configuration structure.
	 *  All but the second-to-last parameter are interpreted as keys.
	 * @param {mixed} [$value=null] The last parameter should not be omitted,
	 *  and contains the value to set the field to.
	 */
	function set(
	 $key1,
	 $value = null)
	{
		$args = func_get_args();
		if (!isset($this->p)) {
			$this->p = new Q_Tree;
		}
		return call_user_func_array(array($this->p, __FUNCTION__), $args);
	}

	/**
	 * Clears the value of a field, possibly deep inside the array
	 * @method clear
	 * @param {string} $key1 The name of the first key in the configuration path
	 * @param {string} $key2 Optional. The name of the second key in the configuration path.
	 *  You can actually pass as many keys as you need,
	 *  delving deeper and deeper into the configuration structure.
	 *  All but the second-to-last parameter are interpreted as keys.
	 */
	function clear(
	 $key1)
	{
		$args = func_get_args();
		if (!isset($this->p)) {
			$this->p = new Q_Tree;
		}
		return call_user_func_array(array($this->p, __FUNCTION__), $args);
	}

	/**
	 * Gets values of all fields
	 * @method getAll
	 * @return {array}
	 */
	function getAll()
	{
		$args = func_get_args();
		if (!isset($this->p)) {
			$this->p = new Q_Tree;
		}
		return call_user_func_array(array($this->p, __FUNCTION__), $args);
	}

	/**
	 * Extra shortcuts when calling methods
	 * @method __call
	 * @param {string} $name
	 * @param {array} $args
	 * @return {mixed}
	 */
	function __call ($name, $args)
	{
		// Default implementations of 
		// get
		// set
		// clear
		// getAll
		// beforeSet_$name,
		// afterSet_$name,
		// beforeSet_$name
		// afterSet,
		// isset_$name
		// unset_$name
		// beforeGetRelated
		// beforeGetRelatedExecute
		// beforeRetrieve
		// beforeSave
		// beforeSaveExecute
		// afterSaveExecute
		switch ($name) {
			case 'get':
			case 'set':
			case 'clear':
			case 'getAll':
				if (! isset($this->p))
					$this->p = new Q_Tree();
				return call_user_func_array(array($this->p, $name), $args);
			case 'beforeGetRelated':
				return null;
			case 'beforeGetRelatedExecute':
				return $args[1];
			case 'beforeRetrieve':
				return $args[0];
			case 'afterFetch':
				return $args[0];
			case 'beforeSave':
				return $args[0];
			case 'beforeSaveExecute':
				return $args[0];
			case 'afterSaveExecute':
				return $args[0];
			case 'beforeRemove':
				return true;
			case 'beforeRemoveExecute':
				return $args[0];
			case 'afterRemoveExecute':
				return $args[0];
			case 'afterSet':
				return true;
		}
		
		$pieces = explode('_', $name, 2);

		if ($pieces[0] == 'beforeSet')
			return array($pieces[1], $args[0]);
		if ($pieces[0] == 'afterSet')
			return $args[0];
		if ($pieces[0] == 'beforeGet') {
			$fieldName = $pieces[1];
			if (array_key_exists($fieldName, $this->fields)) {
				return $this->fields[$fieldName];
			} else {
				$get_class = get_class($this);
				$backtrace = debug_backtrace();
				$function = $line = $class = null;
				if (isset($backtrace[4]['function'])) {
					$function = $backtrace[4]['function'];
				}
				if (isset($backtrace[3]['line'])) {
					$line = $backtrace[3]['line'];
				}
				if (isset($backtrace[4]['class'])) {
					$class = $backtrace[4]['class'];
				}
				throw new Exception(
					"$get_class does not have $fieldName field set, "
					. "called in $class::$function (line $line)."
				);
				return null;
			}
		}
		if ($pieces[0] == 'isset') {
			return isset($this->fields[$pieces[1]]);
		} else if ($pieces[0] == 'unset') {
			unset($this->fields[$pieces[1]]);
			return;
		} else if ($pieces[0] == 'get') {
			$relationName = $pieces[1];

			if (isset($args[4])) {
				return $this->getRelated($relationName, $args[0], $args[1], 
					$args[2], $args[3], $args[4]);			
			}
			if (isset($args[3])) {
				return $this->getRelated($relationName, $args[0], $args[1], 
					$args[2], $args[3]);			
			}
			if (isset($args[2])) {
				return $this->getRelated($relationName, $args[0], $args[1], 
					$args[2]);
			}
			if (isset($args[1])) {
				return $this->getRelated($relationName, $args[0], $args[1]);
			}
			if (isset($args[0])) {
				return $this->getRelated($relationName, $args[0]);
			}
			return $this->getRelated($relationName, array());
		}

		$class_name = get_class($this);
		$class_event = implode('/', explode('_', $class_name));
		$args2 = array_merge(array($this), $args);
		$result = Q::event("$class_event/method/$name", $args2, 'before');
		if (!$result) {
			throw new Exception("calling method {$class_name}->{$name}, which doesn't exist");
		}
		
		// otherwise, function doesn't exist.
		return false;
	}
	
	/**
	 * Gets an row or array of rows from a source and a relation
	 * @method from
	 * @param {DbRow|array} $source Can be a object extending Db_Row, 
	 *  or it can be an array of such objects, which must all be of the same class.
	 * @param {string} $relationName The name of the relation to use in getRelated.
	 * @return {DbRow|array} If $source is a single row and the relation was declared with hasOne,
	 *  then a single row is returned. Otherwise, an associative array is returned.
	 *  The keys of the associative array are the serialized keys of the
	 *  rows. The values are themselves either rows, or arrays of rows,
	 *  depending on whether the relation was declared with hasOne or hasMany.
	 */
	static function from(
	 $source,
	 $relationName)
	{
		// TODO: implement
	}

	/**
	 * Deletes the rows in the database
	 * @method remove
	 * @param {string|array} [$search_criteria=null] You can provide custom search criteria here,
	 *  such as array("tag.name LIKE " => $this->name)
	 *  If this is left null, and this Db_Row was retrieved, then the db rows corresponding
	 *  to the primary key are deleted.
	 *  But if it wasn't retrieved, then the modified fields are used as the search criteria.
	 * @param {boolean} [$useIndex=null] If true, the primary key is used in searching for rows to delete. 
	 *  An exception is thrown when some fields of the primary key are not specified
	 * @param {boolean} [$commit=false] If this is TRUE, then the current transaction is committed right after the remove operation.
	 * @return {integer} Returns number of rows deleted
	 */
	function remove ($search_criteria = null, $useIndex = false, $commit = false)
	{
		$class_name = get_class($this);

		// Check if we have specified all the primary key fields,
		if ($useIndex) {
			$primaryKey = $this->getPrimaryKey();
			$primaryKeyValue = $this->calculatePKValue();
			if (!is_array($primaryKeyValue)) {
				throw new Exception("No fields of the primary key were specified for $class_name.");
			}
			if (is_array($primaryKey)) {
				foreach ($primaryKey as $fieldName)
					if (! array_key_exists($fieldName, $primaryKeyValue))
						throw new Exception("Primary key field $fieldName was not specified for $class_name.");
				foreach ($primaryKeyValue as $fieldName => $value)
					if (! in_array($fieldName, $primaryKey))
						throw new Exception("The field $fieldName is not part of the primary key for $class_name.");
			}
			$search_criteria = $primaryKeyValue;
		}
		
		// If search criteria are not specified, try to compute them.
		if (!isset($search_criteria)) {
			if ($this->retrieved) {
				// use primary key
				$search_criteria = $this->getPkValue();
			} else {
				// use modified fields
				$modifiedFields = array();
				foreach ($this->fields as $name => $value) {
					if ($this->fieldsModified[$name]) {
						$modifiedFields[$name] = $value;
					}
				}
				$search_criteria = $modifiedFields;
			}
		}
		
		if (class_exists('Q')) {
			$row = $this;
			if (false === Q::event(
				"Db/Row/$class_name/remove",
				@compact('row', 'search_criteria', 'useIndex', 'commit'), 'before'
			)) {
				return false;
			}
		}
		$callback = array($this, "beforeRemove");
		if (is_callable($callback)) {
			$continue_deleting = call_user_func($callback, $search_criteria, $useIndex, $commit);
			if (! is_bool($continue_deleting)) {
				throw new Exception(
					get_class($this)."::beforeRemove() must return a boolean - whether to delete or not!", 
					-1000
				);
			}
			if (!$continue_deleting)
				return false;
		}

		$db = $this->getDb();
		if (empty($db)) {
			throw new Exception("The database was not specified!");
		}
		$table = $this->getTable();
		$query = $db->delete($table)->where($search_criteria);
		if ($commit) {
			$query->commit();
		}
		$query->className = $class_name;
		
		if (class_exists('Q')) {
			/**
			 * @event {before} Db/Row/$class_name/removeExecute
			 * @param {Db_Row} row
			 * @param {Db_Query} query
			 * @param {array} search_criteria
			 * @return {Db_Query|null}
			 *	Modified query
			 */
			$temp = Q::event("Db/Row/$class_name/removeExecute", array(
				'row' => $this,
				'query' => $query,
				'criteria' => $search_criteria
			), 'before');
			if (isset($temp)) {
				$query = $temp;
			}
		}
		
		$callback = array($this, "beforeRemoveExecute");
		if (is_callable($callback))
			$query = call_user_func($callback, $query);

		/* @var $result Db_Result */
		// Now, execute the query!
		if (! empty($query) and $query instanceof Db_Query_Interface) {
			/* @var $query Db_Query_Mysql */
			$result = $query->execute();
		}
		
		$callback = array($this, "afterRemoveExecute");
		if (is_callable($callback)) {
			$result = call_user_func($callback, $result, $query);
		}

		if (class_exists('Q')) {
			/**
			 * @event Db/Row/$class_name/removeExecute {after} 
			 * @param {Db_Row} row
			 * @param {Db_Query} query
			 * @param {array} search_criteria
			 * @param {Db_Result} result
			 * @return {Db_Result|null}
			 *	Modified result or NULL if no midifications are necessary
			 */
			$temp = Q::event("Db/Row/$class_name/removeExecute", array(
				'row' => $this,
				'query' => $query,
				'criteria' => $search_criteria,
				'result' => $result
			), 'after');
			if (isset($temp)) {
				$result = $temp;
			}
		}
		
		$this->retrieved = false;
		foreach ($this->fields as $k => $v) {
			$this->fieldsModified[$k] = true;
		}

		return $result->rowCount();
	}

	/**
	 * Saves the row in the database.
	 * 
	 * If the row was retrieved from the database, issues an UPDATE.
	 * If the row was created from scratch, then issue an INSERT.
	 * @method save
	 * @param {boolean} [$onDuplicateKeyUpdate=false] If MySQL is being used, you can set this to TRUE
	 *  to add an ON DUPLICATE KEY UPDATE clause to the INSERT statement,
	 *  or set it to an array to override specific fields with your own Db_Expressions
	 * @param {boolean} [$commit=false] If this is TRUE, then the current transaction is committed right after the save.
	 *  Use this only if you started a transaction before. 
	 * @param {boolean} [$evenIfNotModified=false] If no fields changed, don't execute any query (but still possibly commit)
	 * @return {boolean|Db_Query} If successful, returns the Db_Query that was executed.
	 *  Otherwise, returns false.
	 */
	function save ($onDuplicateKeyUpdate = false, $commit = false, $evenIfNotModified = false)
	{
		$this_class = get_class($this);
		if ($this_class == 'Db_Row') {
			throw new Exception("If you're going to save, please extend Db_Row.");
		}

		$fieldNames = method_exists($this, 'fieldNames')
			? $this->fieldNames()
			: null;

		if (class_exists('Q')) {
			/**
			 * Gives an oppotunity to modify the row or do something else.
			 * Also fired for rows during calls to insertManyAndExecute()
			 * @event {before} Db/Row/$class_name/save
			 * @param {Db_Row} row
			 * @param {boolean} onDuplicateKeyUpdate
			 * @param {array} modifiedFields
			 */
			if (false === Q::event(
				"Db/Row/$this_class/save",
				array(
					'row' => $this,
					'onDuplicateKeyUpdate' => &$onDuplicateKeyUpdate,
					'commit' => &$commit
				),
				'before'
			)) {
				return false;
			}
		}

		$modifiedFields = $reallyModifiedFields = array();
		foreach ($this->fields as $name => $value) {
			if ($this->fieldsModified[$name]) {
				$modifiedFields[$name] = $value;
				if ($evenIfNotModified
				or !array_key_exists($name, $this->fieldsOriginal)
				or $value !== $this->fieldsOriginal[$name]) {
					$reallyModifiedFields[$name] = $value;
				}
			}
		}
		
		$callback = array($this, "beforeSave");
		if (is_callable($callback)) {
			$modifiedFields = call_user_func(
				$callback, $modifiedFields, $onDuplicateKeyUpdate, $commit,
				$reallyModifiedFields
			);
		}
		if (! isset($modifiedFields) or $modifiedFields === false) {
			return false;
		}
		if ($modifiedFields instanceof Db_Query) {
			return $modifiedFields;
		}
		if (! is_array($modifiedFields)) {
			throw new Exception(
				"$this_class::beforeSave() must return the array of (modified) fields to save!", 
				-1000
			);
		}

		$fieldsToSave = array();
		if (is_array($fieldNames)) {
			foreach ($fieldNames as $name) {
				if (!empty($this->fieldsModified[$name])) {
					$fieldsToSave[$name] = $this->fields[$name];
				}
			}
		} else {
			foreach ($this->fields as $name => $value) {
				if (!empty($this->fieldsModified[$name])) {
					$fieldsToSave[$name] = $value;
				}
			}
		}

		foreach ($fieldsToSave as $k=>$v) {
			$this->$k = $v;
		}

		$db = $this->getDb();
		if (empty($db))
			throw new Exception("The database was not specified!");
		$table = $this->getTable();
		if ($this->retrieved) {
			// Do an update of an existing row
			// If pkValue contains more or less fields than
			// the primary key should, it is only through tinkering.
			// We'll let it pass, since the person was most likely
			// trying to do something clever.
			if (!$this->getPrimaryKey()) {
				throw new Exception("Db_Row cannot update an existing row using without a primary key");
			}
			$where = $this->getPkValue();
			if (!$where) {
				throw new Exception("The primary key is not specified for $table");
			}
			if (empty($fieldsToSave)
			or (!$evenIfNotModified and empty($reallyModifiedFields))) {
				$this->wasModified(false);
				if ($commit) {
					$class = get_class($this);
					$db = call_user_func(array($class, 'db'));
					$query = $db->rawQuery('')->commit();
					$query->className = get_class($this);
					$query->execute(false, $query->shard(null, $where));
				}
				return false;
            }
			$query = $db->update($table)
				->set($fieldsToSave)
				->where($where);
			$inserting = false;
		} else {
			// Do an insert
			//if (count($fieldsToSave) == 0)
			//    throw new Exception("No fields have been set. Nothing to save!");
			$query = $db->insert($table, $fieldsToSave);
			if ($onDuplicateKeyUpdate) {
				$onDuplicateKeyUpdate_fields = $fieldsToSave;
				$pk = $this->getPrimaryKey();
				if (count($pk) === 1) {
					$fieldName = reset($pk);
					$onDuplicateKeyUpdate_fields = array_merge(
						array($fieldName => new Db_Expression("LAST_INSERT_ID($fieldName)")),
						$onDuplicateKeyUpdate_fields
					);
				}
				if (is_array($onDuplicateKeyUpdate)) {
					$onDuplicateKeyUpdate_fields = array_merge(
						$onDuplicateKeyUpdate_fields,
						$onDuplicateKeyUpdate
					);
				}
				$query->onDuplicateKeyUpdate($onDuplicateKeyUpdate_fields);
			}
			$where = null;
			$inserting = true;
		}
		$query->className = $this_class;

		if (class_exists('Q')) {
			/**
			 * @event {before} Db/Row/$class_name/saveExecute
			 * @param {Db_Row} row
			 * @param {Db_Query} query
			 * @param {array} modifiedFields
			 * @param {array} where
			 * @return {Db_Query|null}
			 *	Modified query or NULL if no modifications are necessary
			 */
			$temp = Q::event("Db/Row/$this_class/saveExecute", array(
				'row' => $this,
				'query' => $query,
				'inserted' => ($query->type === Db_Query::TYPE_INSERT),
				'modifiedFields' => $fieldsToSave,
				'where' => $where
			), 'before');
			if (isset($temp)) {
				$query = $temp;
			}
		}

		$callback = array($this, "beforeSaveExecute");
		if (is_callable($callback)) {
			$query = call_user_func($callback, $query, $fieldsToSave, $where);
		}

		// Now, execute the query!
		if (! empty($query) and $query instanceof Db_Query_Interface) {
			if ($commit) {
				$query->commit();
			}
			$result = $query->execute();
			if ($inserting) {
				$this->inserted = true; // Record that this row was inserted
				$this->retrieved = true; // Now treat as retrieved
				
				// If this was an insert with a single autoincrement field,
				// the autoincrement field should have been the PK value, so store it.
				$pk = $this->getPrimaryKey();
				if ($new_id = $db->lastInsertId()) {
					if (count($pk) == 1) {
						$fieldName = reset($pk);
						$this->$fieldName = $new_id;
					}
				}
				
				// Save however many fields we can into the primary key value.
				// Next time, this record will be updated.
				foreach ($pk as $fieldName) {
					if (isset($this->fields[$fieldName])) {
						$this->pkValue[$fieldName] = $this->fields[$fieldName];
					}
				}
			}
		}
		
		$inserted = ($query->type === Db_Query::TYPE_INSERT);

		$callback = array($this, "afterSaveExecute");
		if (is_callable($callback)) {
			call_user_func($callback, $result, $query, $fieldsToSave, $where, $inserted);
		}
	
		if (class_exists('Q')) {
			/**
			 * @event Db/Row/$class_name/saveExecute {after}
			 * @param {Db_Row} row
			 * @param {Db_Query} query
			 * @param {array} modifiedFields
			 * @param {Db_Result} result
			 */
			Q::event("Db/Row/$this_class/saveExecute", array(
				'row' => $this,
				'query' => $query,
				'inserted' => $inserted,
				'modifiedFields' => $fieldsToSave,
				'result' => $result
			), 'after');
		}
			
		// Finally, set all fields as unmodified again
		$this->wasModified(false);
		
		return $query;
	}

	/**
	 * Retrieves the row in the database
	 * @method retrieve
	 * @param {string} [$fields='*'] The fields to retrieve and set in the Db_Row.
	 *  This gets used if we make a query to the database.
	 *  Pass true here to fetch all fields or throw an exception if the row is missing.
	 * @param {boolean} [$useIndex=false] If true, the primary key is used in searching. 
	 *  An exception is thrown when some fields of the primary key are not specified
	 * @param {array|boolean} [$modifyQuery=false] If an array, the following keys are options for modifying the query.
	 *   You can call more methods, like limit, offset, where, orderBy,
	 *   and so forth, on that Db_Query. After you have modified it sufficiently,
	 *   get the ultimate result of this function, by calling the resume() method on 
	 *   the Db_Query object (via the chainable interface).
	 *   You can also pass true in place of the modifyQuery field to achieve
	 *   the same effect as array("query" => true)
	 * @param {boolean|string} [$modifyQuery.begin] this will cause the query 
	 *   to have .begin() a transaction which locks the row for update. 
	 *   You should call .save(..., true) to commit the transaction, or else
	 *   other database connections trying to access the row will be blocked.
	 * @param {boolean} [$modifyQuery.rollbackIfMissing=false]
	 *   If begin is true, this option determines whether to immediately
	 *   rollback the transaction if the row we're trying to retrieve is missing.
	 * @param {boolean} [$modifyQuery.ignoreCache]
	 *   If true, then call ignoreCache on the query
	 * @param {boolean} [$modifyQuery.caching]
	 *   If provided, then call caching() on the query, passing this value
	 * @param {boolean} [$modifyQuery.query]
	 *   If true, it will return a Db_Query that can be modified, rather than the result. 
	 * @param {array} [$options=array()] Array of options to pass to beforeRetrieve and afterFetch functions.
	 * @return {array|Db_Row|false} Returns the row fetched from the Db_Result (or returned by beforeRetrieve)
	 *  If retrieve() is called with no arguments, may return false if nothing retrieved.
	 */
	function retrieve (
		$fields = null,
		$useIndex = false, 
		$modifyQuery = false,
		$options = array())
	{
		if (is_array($useIndex)) {
			$modifyQuery = $useIndex;
			$useIndex = $options = null;
		}
		if ($fields === true) {
			$throwIfMissing = true;
			$fields = null;
		} else {
			$throwIfMissing = false;
		}
		if (!isset($fields)) {
			$method = array($this, 'fieldNames');
			if (is_callable($method)) {
				$fieldNames = array();
				foreach (call_user_func($method) as $fn) {
					$fieldNames[] = $fn;
				}
				$fields = implode(',', $fieldNames);
			} else {
				$fields = '*';
			}
		};
		if (!isset($useIndex)) $useIndex = false;
		$search_criteria = null;
		$class_name = get_class($this);
		// Check if we have specified all the primary key fields.
		if ($useIndex === true) {
			$primaryKey = $this->getPrimaryKey();
			$primaryKeyValue = $this->calculatePKValue();
			if (!is_array($primaryKeyValue)) {
				throw new Exception("No fields of the primary key were specified for $class_name.");
			}
			if (is_array($primaryKey)) {
				foreach ($primaryKey as $fieldName)
					if (! array_key_exists($fieldName, $primaryKeyValue))
						throw new Exception(
							"Primary key field $fieldName was not specified for $class_name.");
				foreach ($primaryKeyValue as $fieldName => $value)
					if (! in_array($fieldName, $primaryKey))
						throw new Exception(
							"The field $fieldName is not part of the primary key for $class_name.");
			}
			
			// Use the primary key value as the search criteria
			$use_search_criteria = $primaryKeyValue;
		} else {
			$modifiedFields = array();
			foreach ($this->fields as $name => $value) {
				if ($this->fieldsModified[$name]) {
					$modifiedFields[$name] = $value;
				}
			}
			
			// Use the modified fields as the search criteria
			$use_search_criteria = array();
			foreach ($modifiedFields as $key => $value) {
				$use_search_criteria[$key] = $value;
			}
				
			// If no fields were modified on this object,
			// then this function will just return an empty array -- see below.
		}
		
		$callback = array($this, "beforeRetrieve");
		if (is_callable($callback)) {
			$use_search_criteria = call_user_func($callback, $use_search_criteria, $options);
		}
		
		// Now, get the results.
		if (empty($use_search_criteria)) {
			// it was set by the beforeRetrieve callback
			return $use_search_criteria; 
		} else if ($use_search_criteria instanceof Db_Row) {
			// it was set by the beforeRetrieve callback
			$rows = array($use_search_criteria); 
		} else if (is_array($use_search_criteria) 
		and isset($use_search_criteria[0]) 
		and ($use_search_criteria[0] instanceof Db_Row)) {
			$rows = $use_search_criteria;
		} else {
			$query = $this->getDb()->select($fields, $this->getTable());
			$query->className = $class_name;
			$query->where($use_search_criteria);
				
			// Gather all the arguments together for retrieve_resume() method
			$resume_args = array(
				$fields, $useIndex,
				$modifyQuery, $options
			);
			$resume_args[] = @compact(
				'use_search_criteria', 'options'
			);

			// Modify the query if necessary
			if ($modifyQuery) {
				if ($modifyQuery === true) {
					$modifyQuery = array('query' => true);
				} else {
					$query->options($modifyQuery);
				}
				if (!empty($modifyQuery['query'])) {
					$query->setContext(array($this, 'retrieve'), $resume_args);
					return $query;
				}
			}

			// Return the result
			$resume_args[] = $query;
			$resume_args[] = $throwIfMissing;
			return call_user_func_array(array($this, 'retrieve_resume'), $resume_args);
		}
		
		if (isset($search_criteria)) {
			return $rows;
		}
		
		// Return one db row, as per function description
		if (isset($rows[0])) {
			$this->copyFromRow($rows[0], '', true);
			return $this;
		} else {
			if (!empty($modifyQuery['begin'])
			and !empty($modifyQuery['rollbackIfMissing'])) {
				$this->doRollback();
			}
			if ($throwIfMissing and class_exists('Q_Exception_MissingRow')) {
				try {
					$criteria = http_build_query($use_search_criteria, '', ', ');
				} catch (Exception $e) {
					
				}
				if (!$criteria) {
					$criteria = "given " . implode(", ", array_keys($use_search_criteria));
				}
				throw new Q_Exception_MissingRow(array(
					'table' => $this->getTable(),
					'criteria' => $criteria
				));
			}
			return false;
		}
	}

	function retrieve_resume (
		$fields = '*',
		$useIndex = false, 
		$modifyQuery = false,
		$options = array(),
		$preserved_vars = array(),
		$query = null,
		$throwIfMissing = false)
	{
		$class_name = get_class($this);
		if (class_exists('Q')) {
			/**
			 * @event {before} Db/Row/$class_name/retrieveExecute
			 * @param {Db_Row} row
			 * @param {Db_Query} query
			 * @param {array} modifiedFields
			 * @param {array} options
			 * @return {Db_Query|null}
			 *	Modified query or NULL if no modifications are necessary
			 */
			$temp = Q::event("Db/Row/$class_name/retrieveExecute", array(
				'row' => $this,
				'query' => $query,
				'search_criteria' => $preserved_vars['use_search_criteria'],
				'options' => $options
			), 'before');
			if (isset($temp)) {
				$query = $temp;
			}
		}
		$query->limit(1); // get at most one
		$rows = $query->fetchDbRows(get_class($this));

		// Return one db row, as per function description
		if (!empty($rows)) {
			$this->copyFromRow(reset($rows), '', true);
			if (class_exists('Q')) {
				$params = array(
					'row' => $this,
					'query' => $query,
					'search_criteria' => $preserved_vars['use_search_criteria'],
					'options' => $options
				);
				/**
				 * @event {before} Db/Row/$class_name/retrieveExecute
				 * @param {Db_Row} row
				 * @param {Db_Query} query
				 * @param {array} search_criteria
				 * @param {array} options
				 * @return {Db_Query|null}
				 *	Modified query or NULL if no modifications are necessary
				 */
				Q::event("Db/Row/$class_name/retrieveExecute", $params, 'after');
			}
			return $this;
		} else {
			if (!empty($modifyQuery['begin']) and !empty($modifyQuery['rollbackIfMissing'])) {
				$this->doRollback();
			}
			if ($throwIfMissing and class_exists('Q_Exception_MissingRow')) {
				throw new Q_Exception_MissingRow(array(
					'table' => $this->getTable(),
					'criteria' => $preserved_vars['use_search_criteria']
				));
			}
			return false;
		}
	}

	/**
	 * Retrieves the row in the database, or if it doesn't exist, saves it.
	 * @method retrieveOrSave
	 * @param {string} [$fields='*'] The fields to retrieve and set in the Db_Row.
	 *  This gets used if we make a query to the database.
	 * @param {array|boolean} [$modifyQuery=false] Array of options to pass to beforeRetrieve and afterFetch functions.
	 * @param {array} [$options=array()] Array of options to pass to beforeRetrieve and afterFetch functions.
	 * @return {boolean} returns whether the record was saved (i.e. false means retrieved)
	 */
	function retrieveOrSave (
		$fields = '*', 
		$modifyQuery = false,
		$options = array())
	{
		if ($this->retrieve($fields, true, $modifyQuery, $options)) {
			return false;
		}

		$this->save();
		return true;
	}
	
	/**
	 * Rolls back the latest transaction that was started with
	 * code that looks like $query->begin()->execute().
	 * @method doRollback
	 */
	function doRollback()
	{
		$class_name = get_class($this);
		$db = $this->getDb();
		if (empty($db))
			throw new Exception("The database was not specified!");
		$query = $db->rollback($this->calculatePkValue());
		$query->className = $class_name;
		$query->execute();
	}

	/**
	 * This function copies the members of another row,
	 * as well as the primary key, etc. and assigns it to this row.
	 * @method copyFromRow
	 * @param {Db_Row} $row The source row. Be careful -- In this case, Db does not check 
	 *  whether the class of the Db_Row matches. It leaves things up to you.
	 * @param {string} [$stripPrefix=null] If not empty, only copies the elements with the prefix, stripping it out.
	 *  Useful for assigning parts of Db_Rows that came from joins, to individual table classes.
	 * @param {boolean} [$suppressHooks=false] If true, assigns everything but does not fire the beforeSet and afterSet events.
	 * @param {boolean|null} [$markModified=null] If set, the "modified" status of all copied fields is set to this boolean.
	 * @return {Db_Row} returns this object, for chaining
	 */
	function copyFromRow (
		Db_Row $row, 
		$stripPrefix = null, 
		$suppressHooks = false,
		$markModified = null)
	{
		$this->retrieved = $row->retrieved;
		if (!empty($stripPrefix)) {
			$prefix_len = strlen($stripPrefix);
			$this->pkValue = isset($row->pkValue)
				? Db_Utils::take($row->pkValue, array(), $stripPrefix) 
				: array();
		} else {
			$this->pkValue = $row->pkValue;
		}
		
		foreach ($row->fields as $key => $value) {
			if (!empty($stripPrefix)) {
				if (strncmp($key, $stripPrefix, $prefix_len) != 0)
					continue;
				$stripped_key = substr($key, $prefix_len);
			} else {
				$stripped_key = $key;
			}
			if ($suppressHooks) {
				$this->fields[$stripped_key] = $value;
			} else {
				$this->$stripped_key = $value;
			}
			$this->fieldsModified[$stripped_key] = isset($markModified)
				? $markModified
				: (isset($row->fieldsModified[$key]) ? $row->fieldsModified[$key] : false);
		}
		return $this;
	}

	/**
	 * This function copies the members of an array or something supporting "Enumerable".
	 * @method copyFrom
	 * @param {mixed} $source The source of the parameters. Typically the output of Db_Utils::take, unleashed
	 *  on $_POST or $_REQUEST or something like that. Just used for convenience.
	 * @param {string} [$stripPrefix=null] If not empty, only copies the elements with the prefix, stripping it out.
	 *  Useful for assigning values whose names were prefixed with namespaces.
	 * @param {boolean} [$suppressHooks=false] If true, assigns everything but does not fire the beforeSet and afterSet events.
	 * @param {boolean} [$markModified=true] Defaults to true. Whether to mark the affected fields as modified or not.
	 * @return {Db_Row} returns this object, for chaining
	 */
	function copyFrom (
		$source, 
		$stripPrefix = null, 
		$suppressHooks = false, 
		$markModified = true)
	{
		if ($source instanceof Db_Row)
			return $this->copyFromRow($source, $stripPrefix, $suppressHooks, $markModified);
			
		if ($stripPrefix) {
			$prefix_len = strlen($stripPrefix);
		}
		
		foreach ($source as $key => $value) {
			if ($stripPrefix) {
				if (strncmp($key, $stripPrefix, $prefix_len) != 0)
					continue;
				$stripped_key = substr($key, $prefix_len);
			} else {
				$stripped_key = $key;
			}
			if ($suppressHooks) {
				$this->fields[$stripped_key] = $value;
			} else {
				$this->$stripped_key = $value;
			}
			if ($markModified) {
				$this->fieldsModified[$stripped_key] = true;
			} else {
				$this->fieldsModified[$stripped_key] = false;
			}
		}
		return $this;
	}

	/**
	 * Returns an array of fields representing this row
	 * @method toArray
	 */
	function toArray()
	{
		return $this->fields;
	}

	/**
	 * Returns a safe array to send to clients
	 * @param {$array} [$options=null] accepts an array of options
	 * @method exportArray
	 */
	function exportArray($options = null)
	{
		return $this->toArray();
	}

	/**
	 * Implements __set_state method, so it can be exported
	 * @method __set_state
	 * @param {array} $array
	 */
	public static function __set_state(array $array)
	{
		$result = new Db_Row();
		foreach($array as $k => $v) {
			$result->$k = $v;
		}
		return $result;
	}

	/**
	 * Dumps the result as an HTML table. 
	 * @method __toMarkup
	 * @return {string}
	 */
	function __toMarkup ()
	{
		try {
			$return = "<table class='dbRowTable'>\n";
			$return .= "<tr>\n";
			$return .= "<td class='key'>Field name</td>\n";
			$return .= "<td class='value'>Field value</td>\n";
			$return .= "<td class='modified'>Field modified?</td>\n";
			$return .= "</tr>\n";
			foreach ($this->fields as $key => $value) {
				$return .= "<tr>\n";
				$return .= "<td class='key'>" . htmlentities($key) . '</td>' .
					 "\n";
				$return .= "<td class='value'>" . htmlentities($value) . '</td>' .
					 "\n";
				$return .= "<td class='modified'>"
					. ($this->wasModified($key) 
					 ? 'Yes' 
					 : 'No')
					. '</td>' . "\n";
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
	 * @method __toString
	 */
	function __toString ()
	{
		try {
			$ob = new Q_OutputBuffer();
			$results = array();
			foreach ($this->fields as $key => $value) {
				$results[] = array(
					'Field name:' => $key, 
					'Field value:' => $value, 
					'Field modified:' => $this->wasModified($key) ? 'Yes' : 'No'
				);
			}
			Db_Utils::dump_table($results);
			return $ob->getClean();
		} catch (Exception $e) {
			return $e->getMessage();
		}
	}

	function __sleep ()
	{
		return array_keys(get_object_vars($this));
	}
	
	function __wakeup()
	{
		$this->init();
	}

	/**
	 * Beyond last field
	 * @property $beyondLastField
	 * @type boolean
	 * @default false
	 * @protected
	 */
	protected $beyondLastField = false;
}
