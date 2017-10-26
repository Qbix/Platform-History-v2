<?php

/**
 * @module Streams
 */

/**
 * Tool used to view and manage advertising campaigns
 * @class Websites advert campaigns
 * @constructor
 * @param {array} [$options] Options to pass to the Streams/related tool
 */
function Websites_advert_campaigns_tool($options)
{
	$options['streamName'] = $options['categoryName'];
	return Q::tool('Streams/related', $options);
}