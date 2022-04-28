<?php

/**
 * This tool renders a user avatar
 *
 * @param {array} $options An associative array of parameters, containing:
 * @param {string} [$options.userId]
 *   The user's id. Defaults to id of the logged-in user, if any.
 *   Can be '' for a blank-looking avatar.
 * @param {boolean} [options.short]
 *   Optional. Renders the short version of the display name.
 * @param {boolean|integer} [options.icon=false]
 *   By default, the value is false, so the icon is not rendered.
 *   Pass the size in pixels of the (square) icon to render
 *   before the username. Or pass true to render the default size.
 * @param {array} [options.iconAttributes]
 *   Optional. Array of attributes to render for the icon.
 * @param {boolean|array} [options.editable=false]
 *   Optional. Whether to provide an interface for editing the user's info. Can be array containing one or more of "icon", "name".
 * @param {boolean} [$options.show] The parts of the name to show. Can have "f", "l", "u", "fu", "lu", "flu" in any order, separated by a space.
 * @param {boolean} [options.cacheBust=null]
 *   Number of milliseconds to use for Q_Uri::cacheBust for combating unintended caching on some environments.
 * @param {boolean} [options.renderOnClient=false]
 *   If true, only the html container is rendered, so the client will do the rest.
 */
function Users_avatar_tool($options)
{
	Q_Response::addStylesheet('{{Users}}/css/Users.css', 'Users');
	Q_Response::addScript('{{Streams}}/js/tools/avatar.js', 'Streams');
	$defaults = array(
		'icon' => false,
		'short' => false,
		'cacheBust' => null,
		'editable' => false
	);
	$options = array_merge($defaults, $options);
	$loggedInUser = Users::loggedInUser();
	$loggedInUserId = $loggedInUser ? $loggedInUser->id : "";
	unset($options['iconAttributes']);
	if (empty($options['editable'])) {
		$options['editable'] = array();
	} else if (is_string($options['editable'])) {
		$options['editable'] = array($options['editable']);
	} else if ($options['editable'] === true) {
		$options['editable'] = array('icon', 'name');
	}
	if (!empty($options['renderOnClient'])) {
		return '';
	}
	if (!isset($options['userId'])) {
		$options['userId'] = $loggedInUserId;
	}
	if ($options['userId'] === '') {
		return '<div class="Users_avatar_icon Users_avatar_icon_blank"></div>'
			.'<div class="Users_avatar_name Users_avatar_name_blank">&nbsp;</div>';
	}
	$avatar = Streams_Avatar::fetch($loggedInUserId, $options['userId']);
	if (!$avatar) {
		return '';
	}
	$result = '';
	if ($icon = $options['icon']) {
		if ($icon === true) {
			$icon = Q_Image::getDefaultSize('Users/icon');
		}
		$sizes = Q_Image::getSizes('Users/icon');
		$icon2 = Q_Image::calculateSize($icon, $sizes);
		$attributes = isset($options['iconAttributes'])
			? $options['iconAttributes']
			: array();
		$class = "Users_avatar_icon Users_avatar_icon_$icon";
		$attributes['class'] = isset($attributes['class'])
			? $attributes['class'] . ' ' . $class
			: $class;
		if (isset($options['cacheBust'])) {
			$attributes['cacheBust'] = $options['cacheBust'];
		}
		$result .= Q_Html::img(
			Users::iconUrl($avatar->icon, "$icon2.png"),
			'user icon', $attributes
		);
	}
	$o = $options['short'] ? array('short' => true) : array();
	$o['html'] = true;
	if (in_array('name', $options['editable'])) {
		$show = Q::ifset($options, 'show', 'u f l');
		$streams = Streams::fetch(null, $options['userId'], array(
			'Streams/user/firstName', 'Streams/user/lastName', 'Streams/user/username'
		));
		foreach ($streams as $s) {
			$s->addPreloaded();
		}
	}
	if (isset($options['show'])) {
		$o['show'] = $options['show'];
	}
	$text = Q_Text::get('Users/content');
	$Someone = Q::ifset($text, 'avatar', 'Someone', 'Someone');
	$displayName = $avatar->displayName($o, $Someone);
	$result .= "<span class='Users_avatar_name'>$displayName</span>";

	// define 'content' if 'show' defined
	// if 'show' empty - means 'content'=false
	if (!isset($options['contents']) && isset($options['show'])) {
		$options['contents'] = (bool)$options['show'];
	}

	Q_Response::setToolOptions($options);

	return $result;
}
