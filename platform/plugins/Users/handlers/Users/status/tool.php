<?php

/**
 * Renders a user status area which displays logged in status and provides various user-related operations.
 * @param $options
 *   An associative array of parameters, which can include:
 *   "icon" => Optional. Icon for the login button. Defaults to Qbix icon.
 *   "label" => Optional. Text for the login button. Defaults to 'log in'.
 *   "logoutIcon" => Optional. Icon for 'Log out' item in the tool menu.
 *   "menuItems" => Optional. Additional menu items beside 'Log out' which will be shown in user menu.
 *                  Should be an array of hashes like { 'contents': 'value', 'action': 'value' }.
 *   "onCancel" => Optional. Function, string function name or Q.Event. Called when user was unable to login or cancelled login dialog.
 *   "onLogin" => Optional. Function or Q.Event. Called when user successfully logged it.
 *   "onLogout" => Optional. Function, string function name or Q.Event. Called when user successfully logged out.
 *   "onMenuSelect" => Optional. Function, string function name or Q.Event.
 *                     Called when user selected some item from user selected some item from user menu except 'Log out'.
 * @return {string}
 */
function Users_status_tool($options)
{
	$defaults = array(
		'icon' => '{{Q}}/img/ui/qbix_icon' . (Q_Request::isMobile() ? '_small' : '') . '.png',
		'label' => 'log in',
		'logoutIcon' => null,
		'menuItems' => array(),
		'onCancel' => null,
		'onLogin' => null,
		'onLogout' => null,
		'onMenuSelect' => null
	);
	$options = array_merge($defaults, $options);
	Q_Response::addStylesheet('{{Q}}/css/Q.css', 'Q');
	Q_Response::addStylesheet('{{Users}}/css/Users.css', 'Users');
	Q_Response::setToolOptions($options);
	return Q::view('Users/tool/status/status.php', $options);
}
