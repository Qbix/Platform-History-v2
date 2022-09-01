<?php

/**
 * @module Streams-tools
 */
	
/**
 * Generates a form with inputs that modify various streams
 * @class Streams form
 * @constructor
 * @param {array} $options
 *  An associative array of parameters, containing:
 * @param {array} [$options.fields] an associative array of ($id => $fieldinfo) pairs,
 *   where $id is the id to append to the tool's id, to generate the input's id,
 *   and $fieldinfo is either an associative array with the following fields,
 *   or a regular array consisting of fields in the following order:
 *   <ol>
 *     <li>"publisherId": Required. The id of the user publishing the stream</li>
 *     <li>"streamName": Required. The name of the stream</li>
 *     <li>"field": The stream field to edit, or "attribute:$attributeName" for an attribute.</li>
 *     <li>"input": The type of the input (@see Q_Html::smartTag())</li>
 *     <li>"attributes": Additional attributes for the input</li>
 *     <li>"options": options for the input (if type is "select", "checkboxes" or "radios")<li>
 *     <li>"params": array of extra parameters to Q_Html::smartTag</li>
 *   </ol>
 */
function Streams_form_tool($options)
{
	$fields = Q::ifset($options, 'fields', array());
	$defaults = array(
		'publisherId' => null,
		'streamName' => null,
		'field' => null,
		'type' => 'text',
		'attributes' => array(),
		'value' => array(),
		'options' => array(),
		'params' => array()
	);
	$sections = array();
	$hidden = array();
	$contents = '';
	foreach ($fields as $id => $field) {
		if (Q::isAssociative($field)) {
			$r = Q::take($field, $defaults);
		} else {
			$c = count($field);
			if ($c < 4) {
				throw new Q_Exception("Streams/form tool: field needs at least 4 values");
			}
			$r = array(
				'publisherId' => $field[0],
				'streamName' => $field[1],
				'field' => $field[2],
				'type' => $field[3],
				'attributes' => isset($field[4]) ? $field[4] : array(),
				'value' => isset($field[5]) ? $field[5] : '',
				'options' => isset($field[6]) ? $field[6] : null,
				'params' => isset($field[7]) ? $field[7] : null,
			);
		}
		$r['attributes']['name'] = "input_$id";
		if (!isset($r['type'])) {
			var_dump($r['type']);exit;
		}
		$stream = Streams_Stream::fetch(null, $r['publisherId'], $r['streamName']);
		if ($stream) {
			if (substr($r['field'], 0, 10) === 'attribute:') {
				$attribute = trim(substr($r['field'], 10));
				$value = $stream->get($attribute, $r['value']);
			} else {
				$field = $r['field'];
				$value = $stream->$field;
			}
		} else {
			$value = $r['value'];
		}
		$tag = Q_Html::smartTag(
			$r['type'], $r['attributes'], $value, $r['options'], $r['params']
		);
		$class1 = 'publisherId_'.Q_Utils::normalize($r['publisherId']);
		$class2 = 'streamName_'.Q_Utils::normalize($r['streamName']);
		$contents .= "<span class='Q_before $class1 $class2'></span>"
		. Q_Html::tag('span', array(
			'data-publisherId' => $r['publisherId'],
			'data-streamName' => $r['streamName'],
			'data-field' => $r['field'],
			'data-type' => $r['type'],
			'class' => "$class1 $class2"
		), $tag);
		$hidden[$id] = array(!!$stream, $r['publisherId'], $r['streamName'], $r['field']);
	}
	$contents .= Q_Html::hidden(array(
		'inputs' => Q::json_encode($hidden)
	));
	return Q_Html::form('Streams/form', 'post', array(), $contents);
	//
	// $fields = array('onSubmit', 'onResponse', 'onSuccess', 'slotsToRequest', 'loader', 'contentElements');
	// Q_Response::setToolOptions(Q::take($options, $fields));
	// Q_Response::addScript('{{Q}}/js/tools/form.js', 'Streams');
	// Q_Response::addStylesheet('{{Q}}/css/form.css', 'Streams');
	// return $result;
}
