<?php

/**
 * Renders a Websites/presentation stream,
 * including an interface to edit the presentation
 * for users who have the permissions to do so.
 * @param {array} $options
 * @param {string} $options.publisherId
 * @param {string} $options.streamName
 */
function Websites_presentation_tool($options)
{
	Q_Response::addStylesheet('{{Websites}}/css/Websites.css');
	Q_Response::addScript('{{Websites}}/js/Websites.js');
	Q_Response::setToolOptions($options);
	return '';
}