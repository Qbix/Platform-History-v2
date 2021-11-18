<?php

/**
 * Lets the user search for streams by type and title, and choose them
 * @class Streams lookup
 * @constructor
 * @param {array} $options Override various options for this tool
 * @param {string} [$options.publisherId=Q.Users.communityId] id of the user publishing the streams
 * @param {array} [$types=Q_Config::expect('Streams','lookup','types')] the types of streams the user can select
 * @param {array} [$typeNames] pairs of array($type => $typeName) to override names of the types, which would otherwise be taken from the types
 * @param {string} [$options.onChoose] Q.getObject() name for an event handler that occurs when one of the elements with class "Q_filter_results" is chosen. It is passed (streamName, element, obj) where you can modify obj.text to set the text which will be displayed in the text input to represent the chosen item.
 * @param {array} [$options.filter] any options for the Q/filter tool
 */
function Streams_lookup_tool($options)
{
	if (!isset($options['communityId'])) {
		$options['communityId'] = Users::communityId();
	}
	if (!isset($options['types'])) {
		$options['types'] = Q_Config::get('Streams', 'lookup', 'types', array());
	}
	Q_Response::setToolOptions($options);
	return '';
}