<?php

/**
 * @module Q-tools
 */

/**
 * This tool is meant to be wrapped in a <form> tag
 * @class Q form
 * @constructor
 * @param {array} $options An associative array of parameters, containing:
 * @param {array} $options.fields an associative array of fieldname => fieldinfo pairs,
 *   where fieldinfo contains the following:
 *     "type" => the type of the field (@see Q_Html::smartTag())
 *     "attributes" => additional attributes for the field input
 *     "value" => the initial value of the field input
 *     "options" => options for the field input (if type is "select", "checkboxes" or "radios")
 *     "message" => initial message, if any to put in the field's message space
 *     "label" => the label for the field
 *     "extra" => if set, this is html to replace the first cell, displacing the label
 *     "placeholder" => if set, this is the placeholder text for the input
 *     "fillFromRequest" => Defaults to true.
 *       If true, uses $_REQUEST to fill any fields with same name.
 *       Currently doesn't work for names which specify arrays, such as a[b].
 * @param {string} [$options.onSubmit] Optional. Name of the javascript function or url to pass to Q.handle on submit
 * @param {string} [$options.onResponse] Name of the javascript function or url to pass to Q.handle on response
 * @param {string} [$options.onSuccess] Name of javascript function or url to pass to Q.handle on success
 * @param {string} [$options.loader] Optional. Name of a javascript function which takes (action, method, params, slots, callback) as arguments.
 *    It should call the callback and pass it an object with the response info. Can be used to implement caching, etc.
 *    instead of the default HTTP request.
 *    If "loader" is Q.getter and request should be done bypasing cache, assign true to .ignoreCache property of the tool
 * @param {array|string} [$options.slotsToRequest] Optional. A string or array of slot names to request in response. Should include "form".
 * @param {array|string} [$options.contentElements] Optional. Array of $slotName => $cssSelector pairs for child element of the form to fill with HTML returned from the slot.
 * @param {array} [$params] Same as Q_Html::smartTag() params field
 */
function Q_form_tool($options)
{
	if (empty($options['fields'])) {
		$options['fields'] = array();
	}
	if (!array_key_exists('fillFromRequest', $options)) {
		$options['fillFromRequest'] = true;
	}
	if (empty($options['contentElements'])) {
		$options['contentElements'] = array();
	}

	$field_defaults = array(
		'type' => 'text',
		'attributes' => array(),
		'value' => null,
		'options' => array(),
		'message' => '',
		'placeholder' => null
	);
	$tr_array = array();
	$messages_td = false;
	$colspan = '';
	foreach ($options['fields'] as $name => $field) {
		if (isset($field['message'])) {
			$messages_td = true;
			$colspan = "colspan='2'";
		}
	}
	foreach ($options['fields'] as $name => $field) {
		if (!is_array($field)) {
			$name2 = '"'.addslashes($name).'"';
			throw new Q_Exception_WrongType(array(
				'field' => "\$options[$name2]",
				'type' => 'array'
			));
		}
		$field2 = array_merge($field_defaults, $field);
		$type = $field2['type'];
		if ($type === 'hidden') {
			continue;
		}
		$attributes = array(
			'name' => $name,
			'id' => $name
		);
		$value = $field2['value'];
		$o = $field2['options'];
		$p = Q::ifset($field2, 'params', array());
		$message = $field2['message'];
		if (!empty($options['fillFromRequest']) and !in_array($type, array('button', 'submit'))) {
			if (isset($_REQUEST[$name])) {
				$value = $_REQUEST[$name];
			} else if ($type === 'static' or $type === 'date') {
				$parts = array(
					$name.'_hour' => 0,
					$name.'_minute' => 0,
					$name.'_second' => 0,
					$name.'_month' => date('m'),
					$name.'_day' => date('d'),
					$name.'_year' => date('Y')
				);
				$provided = Q::ifset($_REQUEST, array_keys($parts), null);
				if (isset($provided)) {
					$mktime = Q::take($_REQUEST, $parts);
					$value = call_user_func_array('mktime', $mktime);
				}
			}
		}
		if (isset($field2['placeholder'])) {
			$attributes['placeholder'] = $field2['placeholder'];
		}
		if ($field2['attributes']) {
			$attributes = array_merge($attributes, $field2['attributes']);
		}
		if (ctype_alnum($type)) {
			if (isset($attributes['class'])) {
				if (is_array($attributes['class'])) {
					foreach ($attributes['class'] as $k => $v) {
						$attributes['class'][$k] .= " $type";
					}
				} else {
					$attributes['class'] .= " $type";
				}
			} else {
				$attributes['class'] = " $type";
			}
		}
		$label = isset($field['label']) ? $field['label'] : Q_Html::text($name);
		$label = Q_Html::tag('label', array('for' => $attributes['id']), $label);
		$name_text = Q_Html::text($name);
		$extra = isset($field['extra']) ? $field['extra'] : null;
		switch ($type) {
			case 'textarea':
				$tr_rest = "<td class='Q_form_fieldinput' data-fieldname=\"$name_text\" $colspan>"
					. ($extra ? "<div class='Q_form_label'>$label</div>" : '')
					. Q_Html::smartTag($type, $attributes, $value, $o, $p)
					. "</td></tr><tr class='Q_form_undermessage'><td class='Q_form_placeholder'>"
					. "</td><td class='Q_form_undermessage Q_form_textarea_undermessage' $colspan>"
					. "<div class='Q_form_undermessagebubble'>$message</div></td>";
				break;
			default:
				$tr_rest = "<td class='Q_form_fieldinput' data-fieldname=\"$name_text\">"
					. ($extra ? "<div class='Q_form_label'>$label</div>" : '')
 					. Q_Html::smartTag($type, $attributes, $value, $o, $p)
 					. "</td>"
					. ($messages_td
						? "<td class='Q_form_fieldmessage Q_form_{$type}_message'>$message</td>"
						: '')
					. "</tr><tr class='Q_form_undermessage'><td class='Q_form_placeholder'>"
					. "</td><td class='Q_form_undermessage Q_form_{$type}_undermessage' $colspan>"
					. "<div class='Q_form_undermessagebubble'></div></td>";
				break;
		}
		$leftside = $extra ? $extra : $label;
		$tr_array[] = "<tr><td class='Q_form_fieldname'>$leftside</td>$tr_rest</tr>";
	}
	$result = "<table class='Q_form_tool_table'>\n"
		.implode("\n\t", $tr_array)
		."\n</table>";
	foreach ($options['fields'] as $name => $field) {
 		if (isset($field['type']) and $field['type'] === 'hidden') {
			$result .= Q_Html::hidden(array($name => $field['value']));
		}
	}
	$fields = array('onSubmit', 'onResponse', 'onSuccess', 'slotsToRequest', 'loader', 'contentElements');
	Q_Response::setToolOptions(Q::take($options, $fields));
	Q_Response::addScript('{{Q}}/js/tools/form.js', 'Q');
	Q_Response::addStylesheet('{{Q}}/css/tools/form.css', 'Q');
	return $result;
}
