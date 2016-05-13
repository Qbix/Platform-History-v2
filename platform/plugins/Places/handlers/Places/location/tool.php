<?php

/**
 * @module Places-tools
 */

/**
 * Inplace text editor tool to edit the content or attribute of a stream
 * @class Places location
 * @constructor
 * @param {array} [options] used to pass options
 * @param {array} [options.miles] array of { miles: title } pairs, defaults to Places/nearby/miles config
 * @param {array} [options.defaultMiles] override the key in the miles array to select by default. Defaults to "Places/nearby/defaultMiles" config
 * @param {array} [options.map] options for the map
 * @param {integer} [options.map.delay=300] how many milliseconds to delay showing the map, e.g. because the container is animating
 * @param {string} [options.map.prompt="img/map.png"] The src of the map graphical prompt when no location has been selected yet
 * @param {string} [options.onUpdate] name an event handler for when the location is updated
 * @param {string} [options.onUnset] name an event handler for when the location is unset
 */
function Places_location_tool($options)
{
	if (empty($options['miles'])) {
		$options['miles'] = array();
		foreach (Q_Config::expect('Places', 'nearby', 'miles') as $m) {
			$options['miles'][$m] = $m === 1 ? "$m mile" : "$m miles";
		}
	}
	if (empty($options['map']['prompt'])) {
		$options['map']['prompt'] = Q_Html::themedUrl('plugins/Places/img/map.png');
	}
	if (!isset($options['defaultMiles'])) {
		$options['defaultMiles'] = Q_Config::expect('Places', 'nearby', 'defaultMiles');
	}
	
	Q_Response::setToolOptions($options);
	return Q::view("Places/tool/location.handlebars", $options);
}