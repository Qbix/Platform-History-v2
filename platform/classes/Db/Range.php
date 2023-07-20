<?php

/**
 * @module Db
 */

class Db_Range
{
	/**
	 * This class lets you use make range queries, in a structured way.
	 * @class Db_Range
	 * @constructor
	 * @param {mixed} $min Minimal value of the range. Pass null to skip the min.
	 * @param {boolean} $includeMin Whether the range extends to include the minimum value
	 * @param {boolean} $includeMax Whether the range extends to include the maximum value
	 * @param {mixed} $max Maximal value of the range. Pass null to skip the max.
	 *  If boolean true is passed here, then $max is set to $min with the last character
	 *  incremented to the next character value (used for string prefixes).
	 */
	function __construct ($min, $includeMin, $includeMax, $max)
	{
		$this->min = $min;
		$this->includeMin = $includeMin;
		$this->includeMax = $includeMax;
		if ($max === true) {
			if (!is_string($min)) {
				throw new Exception("Db_Range: min is the wrong type, expected a string");
			}
			$last_char = strlen($min) ? substr($min, -1) : ' ';
			$max = substr($min, 0, -1).chr(ord($last_char)+1);
		}
		$this->max = $max;
	}
	
	function __toString ()
	{
		$min = $this->min;
		$max = $this->max;
		$includeMin = $this->includeMin;
		$includeMax = $this->includeMax;
		$firstPart = isset($min) ? ($includeMin ? "$min <=" : "$min <") : '';
		$secondPart = isset($max) ? ($includeMax ? "<= $max" : "< $max") : '';
		return "$firstPart ... $secondPart";
	}
	/**
	 * Minimal value of the range
	 * @property $min
	 * @type mixed
	 */
	/**
	 * Maximal value of the range
	 * @property $max
	 * @type mixed
	 */
	/**
	 * Wheather maximum value shall be included to the range
	 * @property $includeMax
	 * @type boolean
	 */
	/**
	 * Wheather minimum value shall be included to the range
	 * @property $includeMin
	 * @type boolean
	 */
	public $min, $max, $includeMin, $includeMax;
}