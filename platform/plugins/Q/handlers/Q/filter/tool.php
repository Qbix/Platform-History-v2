<?php

/**
 * @module Q-tools
 */

/**
 * Implements an input that filters an associated list (like an autocomplete)
 * @class Q filter
 * @constructor
 * @param {array} [$options] Override various options for this tool
 *  @param {String} [$options.name='filter'] The name of the text input
 *  @param {String} [$options.value=''] The initial value of the text input
 *  @param {String} [$options.placeholder] Any placeholder text
 *  @param {array} [$options.placeholders={}] Options for Q/placeholders, or null to omit it
 *  @param {String} [$options.results=''] HTML to display in the results initially. If setting them later, remember to call stateChanged('results')
 *  @param {Q.Event} [$options.onFilter] Name of a JS event handler that is meant to fetch and update results by editing the contents of the element pointed to by the second argument. The first argument is the content of the text input.
 * @return {string}
 */
function Q_filter_tool($options)
{
	Q_Response::setToolOptions($options);
	$name = Q::ifset($options, 'name', 'filter');
	$value = Q::ifset($options, 'value', '');
	$placeholder = Q::ifset($options, 'placeholder', 'filter');
	$class = 'Q_filter_input';
	Q_Response::addScript('{{Q}}/js/tools/filter.js', 'Q');
	Q_Response::addStylesheet('{{Q}}/css/filter.css', 'Q');
	return Q_Html::input($name, $value, @compact('placeholder', 'class'))
		. '<div class="Q_filter_results"></div>';
}