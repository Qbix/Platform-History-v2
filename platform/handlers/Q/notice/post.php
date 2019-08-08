<?php

/**
 * @module Q
 */

/**
 * Used to add a notice from the client
 * @class HTTP Q notice
 * @method post
 * @param $_REQUEST
 * @param {string} $_REQUEST.key Required, the key for the notice
 * @param {string} $_REQUEST.content Required, the text content for the notice, will be HTML escaped
 * @param {string} $_REQUEST.options Required. JSON of options for Q_Request::setNotice()
 * @return void
 */
function Q_notice_post()
{
	Q_Request::requireFields(array('key', 'content'), true);
	$options = Q::ifset($_REQUEST, 'options', array());
	if (is_string($options)) {
		$options = Q::json_decode($options);
	}
	$content = Q::text($_REQUEST['content']);
	Q_Response::setNotice($_REQUEST['key'], $content, $options);
}
