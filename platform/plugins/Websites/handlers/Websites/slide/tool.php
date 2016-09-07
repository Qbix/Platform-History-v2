<?php

/**
 * Renders a Websites/slide stream,
 * including an interface to edit the presentation slide
 * for users who have the permissions to do so.
 * @param {array} $options
 * @param {string} $options.publisherId
 * @param {string} $options.streamName
 */
function Websites_slide_tool($options)
{
	Q_Response::addStylesheet('plugins/Websites/css/Websites.css');
	Q_Response::addScript('plugins/Websites/js/Websites.js');
	Q_Response::setToolOptions($options);
	return '';
}