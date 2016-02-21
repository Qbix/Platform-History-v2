<?php

function Broadcast_before_Streams_message_Broadcast($params)
{
	extract($params);
	
	if (!empty($_REQUEST['link'])) {
		$parts = parse_url($_REQUEST['link']);
		if (empty($parts['host'])) {
			throw new Q_Exception_WrongType(array(
				'field' => 'link', 'type' => 'a valid url'
			), 'link');
		}
	}

	$content = array();
	foreach (array('link', 'description', 'picture') as $field) {
		if (!empty($_REQUEST[$field])) {
			$content[$field] = $_REQUEST[$field];
		}
	}

	if (!empty($_REQUEST['content'])) {
			$content['message'] = $_REQUEST['content'];
	}

	if (!$content) {
		throw new Q_Exception_RequiredField(array(
			'field' => 'content'
		), 'content');
	}
	
	// Manually adding a link for 'Manage or Remove'
	$appUrl = Q_Config::get('Users', 'facebookApps', 'Broadcast', 'url', '');
	$content['actions'] = Q::json_encode(array(array('name' => 'Manage or Remove', 'link' => $appUrl)));
	$message->broadcast_instructions = Q::json_encode($content);
}
