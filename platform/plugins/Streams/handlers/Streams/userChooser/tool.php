<?php

/**
 * Streams Tools
 * @module Streams-tools
 * @main
 */

/**
 * Interface for selecting an app user
 * @class Streams userChooser
 * @constructor
 * @param {array} [$options] this object contains function parameters
 *   @param {string} [$options.onChoose] is triggered with (userId, avatar)
 *       parameters when a user is chosen
 *   @param {integer} [$options.delay=500] how long to delay before sending a request
 *    to allow more characters to be entered
 *   @param {bool} [options.communitiesOnly=false] If true, search communities instead regular users
 *   @param {array} [$options.exclude] hash of {userId: true}, 
 *    where userId are the ids of the users to exclude from the results.
 *    Defaults to id of logged-in user, if logged in.
 */
function Streams_userChooser_tool($options)
{
	$text = Q_Text::get('Q/content');
	$placeholder = Q::ifset($text, 'input', 'Placeholder', 'Start typing...');
	extract($options);
	
	if (!isset($exclude) and $user = Users::loggedInUser()) {
		$exclude = array($user->id => true);
	}
	
	Q_Response::addScript('{{Streams}}/js/Streams.js', 'Streams');
	Q_Response::setToolOptions($options);
	return Q_Html::input('query', '', array(
		'class' => 'text Streams_userChooser_input', 
		'placeholder' => $placeholder,
		'autocomplete' => 'off'
	));
}
