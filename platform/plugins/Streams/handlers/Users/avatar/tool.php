<?php

/**
 * This tool renders a user avatar
 *
 * @param {array} $options An associative array of parameters, containing:
 * @param {boolean} [options.userId]
 *   "userId" => The user's id. Defaults to id of the logged-in user, if any.
 * @param {boolean} [options.short]
 *   "short" => Optional. Renders the short version of the display name.
 * @param {boolean|integer} [options.icon=false]
 *   "icon" => Optional. Pass the size in pixels of the (square) icon to render
 *   before the username. Or pass true to render the default size.
 * @param {array} [options.iconAttributes]
 *   "iconAttributes" => Optional. Array of attributes to render for the icon.
 * @param {boolean} [options.editable=false]
 *   "editable" => Optional. Whether to provide an interface for editing the user's info. Can be array containing one or more of "icon", "name".
 *   @param {boolean} [$options.show] The parts of the name to show. Can have the letters "f", "l", "u" in any order.
 * @param {boolean} [options.cacheBust=null]
 *   "cacheBust" => Number of milliseconds to use for Q_Uri::cacheBust for combating unintended caching on some environments.
 * @param {boolean} [options.renderOnClient]
 *    If true, only the html container is rendered, so the client will do the rest.
 */
function Users_avatar_tool($options)
{
	$defaults = array(
		'icon' => false,
		'short' => false,
		'cacheBust' => null,
		'editable' => false
	);
	$options = array_merge($defaults, $options);
	Q_Response::addStylesheet('plugins/Users/css/Users.css');
	$loggedInUser = Users::loggedInUser();
	$loggedInUserId = $loggedInUser ? $loggedInUser->id : "";
	if (empty($options['userId'])) {
		$options['userId'] = $loggedInUserId;
	}
	unset($options['iconAttributes']);
	if (!empty($options['editable'])
	and is_string($options['editable'])) {
		$options['editable'] = array($options['editable']);
	}
	Q_Response::setToolOptions($options);
	if (!empty($options['renderOnClient'])) {
		return '';
	}
	$avatar = Streams_Avatar::fetch($loggedInUserId, $options['userId']);
	if (!$avatar) {
		return '';
	}
	$result = '';
	if ($icon = $options['icon']) {
		if ($icon === true) {
			$icon = Q_Config::get('Users', 'icon', 'defaultSize', 40);
		}
		$attributes = isset($options['iconAttributes'])
			? $options['iconAttributes']
			: array();
		$attributes['class'] = isset($attributes['class'])
			? $attributes['class'] . ' Users_avatar_icon'
			: 'Users_avatar_icon';
		if (isset($options['cacheBust'])) {
			$attributes['cacheBust'] = $options['cacheBust'];
		}
		$result .= Q_Html::img(
			Users::iconUrl($avatar->icon, "$icon.png"),
			'user icon', $attributes
		);
	}
	$o = $options['short'] ? array('short' => true) : array();
	$o['html'] = true;
	if (!empty($options['show'])) {
		$o['show'] = $options['show'];
	} else if ($options['editable'] === true) {
		$o['show'] = 'fl';
	}
	$displayName = $avatar->displayName($o, 'Someone');
	$result .= "<span class='Users_avatar_name'>$displayName</span>";
	return $result;
}
