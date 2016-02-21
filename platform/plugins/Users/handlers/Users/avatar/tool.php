<?php

/**
 * This tool renders a user avatar
 *
 * @param {array} $options An associative array of parameters, containing:
 * @param {boolean} [$options.userId]
 *   "userId" => The user's id. Defaults to id of the logged-in user, if any.
 * @param {boolean} [$options.icon]
 *   "icon" => Optional. Render icon before the username.
 * @param {boolean} [$options.iconAttributes]
 *   "iconAttributes" => Optional. Array of attributes to render for the icon.
 * @param {boolean} [$options.editable]
 *   "editable" => Optional. Whether to provide an interface for editing the user's info. Can be array containing "icon", "name".
 * @param {array} [$options.inplaces] Additional fields to pass to the child Streams/inplace tools, if any
 * @param {boolean} [$options.renderOnClient]
 *    If true, only the html container is rendered, so the client will do the rest.
 */
function Users_avatar_tool($options)
{
	$defaults = array(
		'icon' => false,
		'editable' => false
	);
	$options = array_merge($defaults, $options);
	if (empty($options['userId'])) {
		$user = Users::loggedInUser();
		$options['userId'] = $user->id;
	} else {
		$user = Users_User::fetch($options['userId']);
	}
	Q_Response::addStylesheet('plugins/Q/css/Q.css');
	Q_Response::setToolOptions($options);
	if (!empty($options['renderOnClient'])) {
		return '';
	}
	
	if (!$user) {
		return '';
	}
	$user->addPreloaded();
	$p = $options;
	$p['userId'] = $user->id;
	Q_Response::setToolOptions($p);
	$result = '';
	$icon = $options['icon'];
	if ($icon) {
		if ($icon === true) {
			$icon = Q_Config::get('Users', 'icon', 'defaultSize', 40);
		}
		$attributes = isset($options['iconAttributes'])
			? $options['iconAttributes']
			: array();
		$attributes['class'] = isset($attributes['class'])
			? $attributes['class'] . ' Users_avatar_icon'
			: 'Users_avatar_icon';
		$result .= Q_Html::img($user->iconUrl($icon), 'user icon', $attributes);
	}
	$result .= '<span class="Users_avatar_name">' . $user->username . '</span>';
	return $result;
}
