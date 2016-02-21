<?php

/**
 * @module Q-tools
 */

/**
 * Creates an area that behaves like position: fixed in most modern browsers,
 * including ones on touchscreens. Often used for fixed areas that wind up
 * covered by content as it scrolls over the areas.
 * @class Q drawers
 * @constructor
 * @param {Object}   [options] Provide options for this tool
 *  @param {string}  [options.drawers] Array of strings holding html for drawers
 */
function Q_drawers_tool($options)
{
	$result = '';
	foreach ($options['drawers'] as $i => $html) {
		$result .= Q_Html::div("drawer_$i", "Q_drawers_drawer Q_drawers_drawer_$i", $html);
	}
	unset($options['drawers']);
	Q_Response::addScript('plugins/Q/js/tools/drawers.js');
	Q_Response::addStylesheet('plugins/Q/css/drawers.css');
	Q_Response::setToolOptions($options);
	return $result;
}