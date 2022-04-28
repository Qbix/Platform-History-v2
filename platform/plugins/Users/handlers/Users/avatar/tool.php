<?php

/**
 * This tool renders a user avatar
 *
 * @param {array} $options An associative array of parameters, containing:
 * @param {string} [$options.userId]
 *   The user's id. Defaults to id of the logged-in user, if any.
 *   Can be '' for a blank-looking avatar.
 * @param {boolean} [$options.icon]
 *   Optional. Render icon before the username.
 * @param {boolean} [$options.iconAttributes]
 *   Optional. Array of attributes to render for the icon.
 * @param {boolean} [$options.editable]
 *   Optional. Whether to provide an interface for editing the user's info. Can be array containing "icon", "name".
 * @param {array} [$options.inplaces] Additional fields to pass to the child Streams/inplace tools, if any
 * @param {boolean} [$options.renderOnClient=false]
 *    If true, only the html container is rendered, so the client will do the rest.
 */
function Users_avatar_tool($options)
{
	Q_Response::addStylesheet('{{Users}}/css/Users.css', 'Users');
	Q_Response::addScript('{{Users}}/js/tools/avatar.js', 'Users');
	Q_Response::setToolOptions($options);
	$defaults = array(
		'icon' => false,
		'editable' => false
	);
	$options = array_merge($defaults, $options);
	if (!empty($options['renderOnClient'])) {
		return '';
	}
	if (!isset($options['userId'])) {
		$user = Users::loggedInUser();
		$options['userId'] = $user->id;
	} else if ($options['userId'] === '') {
		return '<div class="Users_avatar_icon Users_avatar_icon_blank"></div>'
			.'<div class="Users_avatar_name Users_avatar_name_blank">&nbsp;</div>';
	} else {
		$user = Users_User::fetch($options['userId']);
	}
	if (!$user) {
		return '';
	}
	$user->addPreloaded();
	$p = $options;
	$p['userId'] = $user->id;
	$result = '';
	$icon = $options['icon'];
	if ($icon) {
		if ($icon === true) {
			$icon = Q_Image::getDefaultSize('Users/icon');
		}
		$attributes = isset($options['iconAttributes'])
			? $options['iconAttributes']
			: array();
		$class = "Users_avatar_icon Users_avatar_icon_$icon";
		$attributes['class'] = isset($attributes['class'])
			? $attributes['class'] . ' ' . $class
			: $class;
		$result .= Q_Html::img($user->iconUrl($icon), 'user icon', $attributes);
	}
	$result .= '<span class="Users_avatar_name">' . $user->displayName() . '</span>';
	return $result;
}
