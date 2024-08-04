<?php

/**
 * @module Db
 */

class Db_Expression
{
	/**
	 * This class lets you use Db expressions
	 * 
	 * **Note:** *if you re-use the same Db_Expression object across one or more queries,
	 * please be aware that this may cause problems if we ever decide
	 * to bind parameters by reference instead of value, as the parameter
	 * names will remain the same each time the Db_Expression object is used.*
	 * @class Db_Expression
	 * @constructor
	 * @param {Db_Expression|string} $chain1 Pass as many arguments as you want, and they will be concatenated together
	 * with spaces in between them. Db_Expression objects will be enclosed in parentheses before being concatenated.
	 */
	function __construct ($chain1, $chain2 = null)
	{
		$this->expression = '';
		$chain = func_get_args();
		$pieces = array();
		
		static $i = 1;
		foreach ($chain as $arg) {
			if (! isset($arg)) {
				$pieces[] = "NULL"; 
			} else if (is_numeric($arg)) {
				$pieces[] = "$arg";
			} else if (is_string($arg)) {
				$pieces[] = $arg; 
			} else if (is_array($arg)) {
				$expr_list = array();
				foreach ($arg as $expr => $value) {
					if ($value instanceof Db_Expression) {
						$str = $value;
						$this->parameters = array_merge(
							$this->parameters, 
							$value->parameters
						);
					} else {
						$str = ":_dbExpr_$i";
						$this->parameters["_dbExpr_$i"] = $value;
					}
					if (preg_match('/\W/', substr($expr, -1))) {
						$expr_list[] = "($expr $str)";
					} else {
						$expr_list[] = "($expr = $str)";
					}
					++ $i;
				}
				$pieces[] = '(' . implode(' AND ', $expr_list) . ')';
			} else if ($arg instanceof Db_Expression) {
				$pieces[] = "($arg)";
				if (is_array($arg->parameters)) {
					$this->parameters = array_merge(
						$this->parameters, 
						$arg->parameters
					);
				}
			}
		}
		$this->expression = implode(' ', $pieces);
	}

	/**
	 * Walks through an array and calls Q::interpolate() on
	 * expressions inside Db_Expression objects.
	 * @method interpolateArray
	 * @static
	 * @param {array} $arr
	 * @param {array} $params
	 * @return {array}
	 */
	static function interpolateArray(array $arr, array $params)
	{
		$result = array();
		foreach ($arr as $k => $v) {
			if ($v instanceof Db_Expression) {
				$v2 = clone $v;
				$v2->expression = Q::interpolate($v->expression, $params);
				$result[$k] = $v2;
			} else {
				$result[$k] = $v;
			}
		}
		return $result;
	}

	/**
	 * The expression as a string
	 * @property $expression
	 * @type string
	 */
	public $expression;
	
	/**
	 * The query that was run to produce this result
	 * @property $chain
	 * @type Db_Query
	 */
	public $chain;
	
	/**
	 * The parameters to bind with the expression
	 * @property $parameters
	 * @type array
	 * @protected
	 */
	protected $parameters;

	function __toString ()
	{
		return $this->expression;
	}
}
;
