<?php

/**
 * Calendars
 * @module Calendars
 * @main Calendars
 */
/**
 * Static methods for the Calendars plugin
 * @class Calendars
 * @abstract
 */
class Calendars
{
	/**
	 * @static
	 * @method defaultDateFilter
	 */
	static function defaultDateFilter($experienceId = 'main', $today = null)
	{
		if (!$today) {
			$today = date("Y-m-d"); // NOTE; this is the date on the server
		}
		$dates = Calendars::experience($experienceId)->getAttribute('dates', array());
		$today = Q::ifset($_REQUEST, 'today', date("Y-m-d"));
		$day = null;
		foreach ($dates as $year => $arr1) {
			if (!$arr1) continue;
			foreach ($arr1 as $month => $arr2) {
				if (!$arr2) continue;
				foreach ($arr2 as $day) {
					if ($today === "$year-$month-$day") {
						$date = "$year-$month-$day";
					}
				}
			}
		}
	}
}