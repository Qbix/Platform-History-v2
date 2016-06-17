<?php

/**
 * @module Q-tools
 */

/**
 * Makes an infomation block for adding a bookmarklet on the browser's bookmarks bar
 * the way similar to how facebook does: http://www.facebook.com/share_options.php .
 * Main purpose of the tool is to present in cross-browser way how bookmarklet button will look, how bookmarklet will
 * look on browser panel and instructions how to add bookmarklet to that panel.
 * @param {array} $options An associative array of parameters, which can include:
 * @param {array} [$options.scripts] Array of one or more urls of javascript files (will be run through Q_Html::themedUrl) to be executed in order.
 * @param {string} [$options.content] Literal Javascript code to execute. If scripts option is provided, this code is executed after the scripts have been loaded.
 * @param {string} $options.title Required. Title for the button which will be added to user's browser bar.
 * @param {string} $options.usage Text which is appended to instructions, identifying purpose and usage of this bookmarklet.
 * @param {string} [$options.icon] Icon for the button which will be added to user's browser bar. Can contain placeholders supported by strftime() and also few special placeholders with specific functionality.
 * @return {string}
 */
function Q_bookmarklet_tool($options)
{
    $options = array_merge(array(
  		'icon' => null
    ), $options);
	Q_Response::addScript('plugins/Q/js/tools/bookmarklet.js');
	Q_Response::addStylesheet('plugins/Q/css/bookmarklet.css');
	Q_Response::setToolOptions($options);
	return '';
}
