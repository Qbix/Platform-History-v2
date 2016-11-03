<?php

/**
 * Lets the user search for streams they can lookup a given stream to, and lookup it
 * @class Streams lookup
 * @constructor
 * @param {array} [$options] Override various options for this tool
 * @param {string} $publisherId publisher id of the stream to lookup
 * @param {string} $streamName name of stream to lookup
 * @param {string} [$communityId=Users::communityId()] id of the user publishing the streams to lookup to
 * @param {array} [$types=Q_Config::expect('Streams','lookup','types')] the types of streams the user can select
 * @param {array} [$typeNames] pairs of array($type => $typeName) to override names of the types, which would otherwise be taken from the types
 * @param {string} [$types=Q_Config::expect('Streams','lookup','types')] the types of streams the user can select
 */
function Streams_lookup_tool($options)
{
	Q_Valid::requireFields(array('publisherId', 'streamName'), $options, true);
	if (!isset($options['communityId'])) {
		$options['communityId'] = Users::communityId();
	}
	if (!isset($options['types'])) {
		$options['types'] = Q_Config::get('Streams', 'lookup', 'types', array());
	}
	Q_Response::setToolOptions($options);
	return '';
}