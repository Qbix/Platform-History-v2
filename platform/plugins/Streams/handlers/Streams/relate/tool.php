<?php

/**
 * Lets the user search for streams they can relate a given stream to, and relate it
 * @class Streams relate
 * @constructor
 * @param {array} [$options] Override various options for this tool
 * @param {string} $publisherId publisher id of the stream to relate
 * @param {string} $streamName name of stream to relate
 * @param {string} [$communityId=Users::communityId()] id of the user publishing the streams to relate to
 * @param {array} [$types=Q_Config::expect('Streams','relate','types')] the types of streams the user can select
 * @param {array} [$typeNames] pairs of array($type => $typeName) to override names of the types, which would otherwise be taken from the types
 * @param {Boolean} [options.multiple=true] whether the user can select multiple types for the lookup
 * @param {boolean} [$relateFrom=false] if true, will relate FROM the user-selected stream TO the streamName instead
 * @param {string} [$types=Q_Config::expect('Streams','relate','types')] the types of streams the user can select
 * @param {Q.Event} [$options.onRelate] This event handler occurs when a stream is successfully related
 */
function Streams_relate_tool($options)
{
	Q_Valid::requireFields(array('publisherId', 'streamName'), $options, true);
	if (!isset($options['communityId'])) {
		$options['communityId'] = Users::communityId();
	}
	if (!isset($options['types'])) {
		$options['types'] = Q_Config::get('Streams', 'relate', 'types', array());
	}
	Q_Response::setToolOptions($options);
	return '';
}