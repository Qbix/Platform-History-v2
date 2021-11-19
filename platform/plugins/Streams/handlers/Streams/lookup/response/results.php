<?php

/**
 * @module Streams
 */

/**
 * Used by HTTP clients to look up streams published by a certain publisher, based on their title
 * @class HTTP Streams lookup
 * @method get
 * @param {array} [$_REQUEST] Parameters that can come from the request
 *   @param {string} $_REQUEST.publisherId  Required. The user id of the publisher of the streams
 *   @param {string|array} $_REQUEST.types  Required. The type (or types) of the streams to find
 *   @param {string|array} $_REQUEST.title  Required. The string to use with SQL's "LIKE" statement. May be rejected depending on configuration.
 */
function Streams_lookup_response_results()
{
	Q_Request::requireFields(array('types', 'title'), true);
	$streams = Streams::lookup(
		$_REQUEST['publisherId'],
		$_REQUEST['types'],
		$_REQUEST['title']
	);
	return Db::exportArray($streams);
}