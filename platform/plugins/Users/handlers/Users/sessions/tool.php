<?php

/**
 * This tool renders all user sessions opened.
 * @class Users sessions
 * @constructor
 * @param {array} [$options] An associative array of parameters, containing:
 * @param {string} [$options.userId]
 *   The user's id. Defaults to id of the logged-in user, if any.
 * @param {bool} [$options.editable=true]
 *   Whether user can delete sessions
 * @param {bool} [$options.devices=true]
 *   Whether to show devices info
 */
function Users_sessions_tool($options)
{
	$options = array_merge(array(
		'editable' => true,
		'devices' => true
	), $options);
	Q_Response::addStylesheet('{{Users}}/css/tools/sessions.css', 'Users');
	if (empty($options['userId'])) {
		$options['userId'] = Users::loggedInUser(true)->id;
	}
	Q_Response::setToolOptions($options);

	$sessions = Users_Session::select("us.*, ud.deviceId, ud.platform, ud.version, ud.formFactor", "us")
		->join(Users_Device::table(true, 'ud'), array(
			'us.userId'=>'ud.userId', 'us.id'=>'ud.sessionId'
		), "LEFT")
		->where(array(
			'us.userId' => $options['userId']
		))->fetchDbRows();

	$noDevicesClass = $options['devices'] ? '' : "Users_sessions_showDevices";
	$html = "<table class='Users_sessions_container $noDevicesClass'><tr><th>Session Id</th><th class='Users_sessions_devicesData'>Platform</th><th class='Users_sessions_devicesData'>Version</th><th>Last Updated</th>";
	if ($options["editable"]) {
		$html .= '<th class="Users_sessions_actions"></th>';
	}

	$html .= '</tr>';
	foreach ($sessions as $session) {
		$updatedTime = date("M j, Y g:i A", strtotime($session->updatedTime));
		$html .= "<tr><td class='sessionId'>{$session->id}</td>"
			."<td class='Users_sessions_devicesData'>{$session->platform}</td>"
			."<td class='Users_sessions_devicesData'>{$session->version}</td>"
			."<td>$updatedTime</td>";
		if ($options["editable"]) { 
			$html .= "<td class='actions'><button name='delete'>Delete</button></td>";
		}
		$html .= '</tr>';
	}
	$html .= "</table>";

	return $html;
}

