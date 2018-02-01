<?php

/**
 * Makes a timestamp which is periodically updated.
 * Initially shows time offsets in '<some_time> ago' manner. Later represents time depending on format,
 * wisely excluding unnecessary detais (i.e. 'year' if timestamp has been made this year, 'year' and 'month if in this month etc).
 * @class Q timestamp
 * @constructor
 * @param {array} $options Options for the tool
 *	@param {integer} [$options.time=time()] Unix timestamp (in seconds), defaults to value of time() call.
 *	@param {string} [$options.format] formatting string which makes specific timestamp representation.
 *	 Can contain placeholders supported by strftime() and also few special placeholders with specific functionality.
 */
function Q_timestamp_tool($options)
{
	Q_Response::addScript('{{Q}}/js/tools/timestamp.js', 'Q');
	Q_Response::addScript('{{Q}}/js/phpjs.js', 'Q');
	
	$defaults = array(
		'time' => time(),
		'format' => '{day-week} {date+week} {year+year} %l:%M %P',
	);
	$options = array_merge($defaults, $options);
	Q_Response::setToolOptions($options);
	
	@date_default_timezone_set(ini_get('date.timezone'));
	
	$format = $options['format'];
	$time = $options['time'];
	$now = time();
	$diff = $now - $time;
	$dayLength = 60 * 60 * 24;
	if ($diff > $dayLength) {
		return strftime($format, $time);
	} else if ($diff > 3600 * 2) {
		return floor(($diff) / 3600) . ' hours ago';
	} else if ($diff > 3600) {
		return '1 hour ago';
	} else if ($diff > 60 * 2) {
		return floor(($diff) / 60) . ' minutes ago';
	} else if ($diff > 60) {	
		return '1 minute ago';
	} else if ($diff > 10) {
		return ($diff) . ' seconds ago';
	} else if ($diff > 0) {
		return 'seconds ago';
	} else {
		return strftime($format, $time);
	}
}
