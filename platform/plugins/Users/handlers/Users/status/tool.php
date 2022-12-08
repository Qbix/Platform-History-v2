<?php

/**
 * Renders a dynamic user status area which displays "log in" or the logged-in user's avatar
 * @class Users status
 * @constructor
 * @param {Object} [$options] this object contains function parameters
 *	 @param {String} [$options.avatar] Options for the user avatar
 *	 @param {String} [$options.avatar.icon=80] The default size of the avatar icon
 *	 @param {String} [$options.avatar.contents=!Q.info.isMobile] Whether to show the name
 *	 @param {String} [$options.avatar.short=true] Whether the name shown should be short
 */
function Users_status_tool($options)
{
	Q_Response::addStylesheet('{{Q}}/css/Q.css', 'Q');
	Q_Response::addStylesheet('{{Users}}/css/Users.css', 'Users');
	Q_Response::setToolOptions($options);
	if ($user = Users::loggedInUser(false, false)) {
		$avatar = array(
			'icon' => '80',
			'contents' => !Q_Request::isMobile(),
			'short' => true,
			'userId' => $user->id
		);
		$options['avatar'] = Q_Tree::mergeArrays(
			$avatar, Q::ifset($options, 'avatar', array())
		);
	}
	$options['user'] = $user;
	return Q::view('Users/tool/status/status.php', $options);
}
