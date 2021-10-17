<?php

/**
 * @module Q-tools
 */

/**
 * This tool implements expandable containers that work on most modern browsers,
 * including ones on touchscreens.
 * @class Q expandable
 * @constructor
 * @param {array} $options Options for the tool
 * @param {string} $options.title Required. The title for the expandable.
 * @param {string} $options.content The content. Required unless you pass "items" instead.
 * @param {array} [$options.items] Instead of the content, you can pass an array of strings to wrap in <span> elements and render in the content
 * @param {string} [$options.class] If you use "items", optionally specify the class of the container elements for each item
 * @param {integer} [$options.title] A number, if any, to display when collapsed
 * @param {Boolean} [options.expanded] Whether it should start out expanded
 * @param {boolean} [$options.autoCollapseSiblings=true]  Whether, when expanding an expandable, its siblings should be automatically collapsed.
 */
function Q_expandable_tool($options)
{
	if (isset($options['items'])) {
		$classString = isset($options['class'])
			? "class='$options[class]'"
			: '';
		$lines = array();
		foreach ($options['items'] as $key => $value) {
			$key = Q_Html::text($key);
			$lines[] = "<span data-value='$key' $classString>$value</span>";
		}
		$between = Q::ifset($options, 'between', '');
		$options['content'] = implode($between, $lines);
	}
	foreach (array('title', 'content') as $field) {
		if (!isset($options[$field])) {
			throw new Q_Exception_RequiredField(@compact('field'));
		}
	}
	Q_Response::addScript('{{Q}}/js/tools/expandable.js', 'Q');
	Q_Response::addStylesheet('{{Q}}/css/expandable.css', 'Q');
	$count = Q::ifset($options, 'count', '');
	$style = empty($options['expanded']) ? '' : 'style="display:block"';
	$h2 = "<h2>\n\t<span class='Q_expandable_count'>$count</span>\n\t$options[title]\n</h2>";
	$div = "<div class='Q_expandable_container' $style><div class='Q_expandable_content'>\n\t$options[content]\n</div></div>";
	Q_Response::setToolOptions($options);
	return $h2.$div;
}