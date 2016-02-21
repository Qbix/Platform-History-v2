<?php

/**
 * userChooser tool
 * @param array $options
 *  "maxResults" => the maximum number of results to show, defaults to 3
 *  "onSuccess" => the name of the function for what to do
 *  "placeholder" => override the default placeholder text,
 *  "exclude" => associative array of userId => true, where userId are the ids of the users
 *    to exclude from the results. Defaults to id of logged-in user, if logged in.
 */
function Streams_userChooser_tool($options)
{
	$maxResults = Q_Config::get('Streams', 'userChooser', 'maxResults', 3);
	$placeholder = "Start typing...";
	extract($options);
	
	if (!isset($exclude) and $user = Users::loggedInUser()) {
		$exclude = array($user->id => true);
	}
	
	Q_Response::addScript('plugins/Streams/js/Streams.js');
	Q_Response::setToolOptions(compact('onSuccess', 'maxResults', 'exclude'));
	return Q_Html::input('query', '', array(
		'class' => 'text', 
		'placeholder' => $placeholder,
		'autocomplete' => 'off'
	));
}
