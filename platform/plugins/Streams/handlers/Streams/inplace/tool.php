<?php

/**
 * @module Streams-tools
 */

/**
 * This tool generates an inline editor to edit the content or attribute of a stream.
 * @class Streams inplace
 * @constructor
 * @param {array} $options Options for the tool
 *  An associative array of parameters, containing:
 * @param {string} [$options.inplaceType='textarea'] The type of the fieldInput. Can be "textarea" or "text"
 * @param {array} [$options.convert] The characters to convert to HTML. Pass an array containing zero or more of "\n", " "
 * @param {Streams_Stream} $options.stream A Streams_Stream object
 * @param {string} [$options.field] Optional, name of an field to change instead of the content of the stream
 * @param {string} [$options.attribute] Optional, name of an attribute to change instead of any field.
 * @param {string} [$options.beforeSave] Reference to a callback to call after a successful save. This callback can cancel the save by returning false.
 * @param {array} [$options.inplace=array()] Additional fields to pass to the child Q/inplace tool, if any
 * @uses Q inplace
 */
function Streams_inplace_tool($options)
{
	$texts = Q_Text::get("Streams/content");
	if (empty($options['stream'])) {
		if (empty($options['publisherId']) or empty($options['streamName'])) {
			throw new Q_Exception_RequiredField(array('field' => 'stream'));
		}
		$publisherId = $options['publisherId'];
		$streamName = $options['streamName'];
		$stream = Streams_Stream::fetch(null, $publisherId, $streamName);
		if (!$stream) {
			Streams::$cache['stream'] = null;

			try {
				// try to create stream
				Q::event('Streams/stream/post', array(
					"publisherId" => $publisherId,
					"name" => $streamName,
					"dontSubscribe" => true
				));
			} catch (Exception $e) {}

			$stream = Streams::$cache['stream'];
		}
	} else {
		$stream = $options['stream'];
	}
	$inplaceType = Q::ifset($options, 'inplaceType', 'textarea');
	$inplace = array(
		'method' => 'PUT',
		'type' => $inplaceType
	);
	if (isset($options['inplace'])) {
		$inplace = array_merge($options['inplace'], $inplace);
	}
	$convert = Q::ifset($options, 'convert', array("\n"));
	$inplace['hidden']['convert'] = json_encode($convert);
	if ($stream) {
		$inplace['action'] = $stream->actionUrl();
		$toolOptions = array(
			'publisherId' => $stream->publisherId,
			'streamName' => $stream->name
		);

		if (!empty($options['attribute'])) {
			$field = 'attributes['.urlencode($options['attribute']).']';
			$content = $stream->get($options['attribute'], '');
			$maxlength = $stream->maxSize_attributes() - strlen($stream->maxSize_attributes()) - 10;
		} else {
			$field = !empty($options['field']) ? $options['field'] : 'content';
			$content = $stream->$field;
			$maxlength = $stream->maxSizeExtended($field);
		}
		switch ($inplaceType) {
			case 'text':
				$inplace['fieldInput'] = Q_Html::input($field, $content, array(
					'placeholder' => Q::ifset($inplace, 'placeholder', null),
					'maxlength' => $maxlength
				));
				$inplace['staticHtml'] = Q_Html::text($content);
				break;
			case 'textarea':
				$inplace['fieldInput'] = Q_Html::textarea($field, 5, 80, array(
					'placeholder' => Q::ifset($inplace, 'placeholder', null),
					'maxlength' => $maxlength
				), $content);
				$inplace['staticHtml'] = Q_Html::text($content, $convert);
				break;
			default:
				$toolOptions = array(
					'fallback' => $texts["errors"]["InplaceTypeMustBe"]
				);
		}
		if (!$stream->testWriteLevel('suggest')) {
			$toolOptions = array(
				'fallback' => $texts["errors"]["NotEnoughPermissionsHandleStream"]
			);
		}
	} else {
		$exception = new Q_Exception_MissingRow(array(
			'table' => 'stream',
			'criteria' => Q::json_encode(array(
				'publisherId' => $publisherId,
				'name' => $streamName
			))
		));
		$toolOptions = array(
			'fallback' => $exception->getMessage()
		);
	}
	Q::take($options, array('attribute', 'field', 'convert'), $toolOptions);
	Q_Response::setToolOptions($toolOptions);
	$toolOptions['inplace'] = $inplace;
	$toolOptions['inplaceType'] = $inplaceType;
	Q_Response::addScript('{{Streams}}/js/tools/inplace.js', 'Streams');
	Q_Response::addScript('{{Q}}/js/tools/inplace.js', 'Streams');
	Q_Response::addStylesheet('{{Q}}/css/inplace.css', 'Q');
	return Q::tool("Q/inplace", $inplace);
}
