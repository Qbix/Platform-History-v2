<?php

/**
 * @module Places-tools
 */

/**
 * Inplace text editor tool to edit the content or attribute of a stream
 * @class Places user location
 * @constructor
 * @param {array} [$options] used to pass options
 * @param {array} [$options.meters] array of { meters: title } pairs, by default is generated from Places/nearby/meters config
 * @param {array} [$options.defaultMeters] override the key in the meters array to select by default. Defaults to "Places/nearby/defaultMeters" config
 * @param {string} [$options.units] second parameter to pass to Places::distanceLabel()
 * @param {array} [$options.map] options for the map
 * @param {integer} [$options.map.delay=300] how many milliseconds to delay showing the map, e.g. because the container is animating
 * @param {string} [$options.map.prompt] The text of the prompt for when no location has been selected yet
 * @param {String} [$options.updateButton="Update my location"] the title of the update button
 * @param {string} [$options.onUpdate] name an event handler for when the location is updated
 * @param {string} [$options.onUnset] name an event handler for when the location is unset
 */
function Places_user_location_tool($options)
{
	if (empty($options['meters'])) {
		$options['meters'] = array();
		$units = Q::ifset($options, 'units', Q_Config::get('Places', 'nearby', 'units', null));
		foreach (Q_Config::expect('Places', 'nearby', 'meters') as $m) {
			$options['meters'][$m] = Places::distanceLabel($m, $units);
		}
	}
	if (!isset($options['defaultMeters'])) {
		$options['defaultMeters'] = Q_Config::expect('Places', 'nearby', 'defaultMeters');
	}
	
	Q_Response::setToolOptions($options);
	return '';
}