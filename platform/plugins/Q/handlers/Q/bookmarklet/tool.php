<?php

/**
 * @module Q-tools
 */

/**
 * Makes an infomation block for adding a bookmarklet on the browser's bookmarks bar
 * the way similar to how facebook does: https://www.facebook.com/share_options.php .
 * Main purpose of the tool is to present in cross-browser way how bookmarklet button will look, how bookmarklet will
 * look on browser panel and instructions how to add bookmarklet to that panel.
 * @param {array} $options An associative array of parameters, which can include:
 * @param {string} $options.title Required. Title for the button which will be added to user's browser bar.
 * @param {string} $options.usage Text which is appended to instructions, identifying purpose and usage of this bookmarklet.
 * @param {array} [$options.scripts] Array of one or more urls of javascript files (will be run through Q_Html::themedUrl) to be executed in order.
 * @param {array} [$options.skip] Array of "path.to.object" strings corresponding to options.scripts array, to avoid loading the corresponding script if path.to.object is already defined. Typically names an object which has been defined by the loaded script. Pass nulls in the array for urls you shouldn't skip.
 * @param {string} [$options.content] Literal Javascript code to execute. If scripts option is provided, this code is executed after the scripts have been loaded.
 * @param {string} [$options.icon] Icon for the button which will be added to user's browser bar. Can contain placeholders supported by strftime() and also few special placeholders with specific functionality.
 * @return {string}
 */
function Q_bookmarklet_tool($options)
{
    $options = array_merge(array(
  		'icon' => null
    ), $options);
	Q_Response::addScript('{{Q}}/js/tools/bookmarklet.js', 'Q');
	Q_Response::addStylesheet('{{Q}}/css/bookmarklet.css', 'Q');
	Q_Response::setToolOptions($options);
	return '';
}
