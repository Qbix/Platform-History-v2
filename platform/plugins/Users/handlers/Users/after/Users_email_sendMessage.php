<?php

function Users_after_Users_email_sendMessage($params)
{
	$logMessage = Q::interpolate("Sent message to {{emailAddress}}:\n{{subject}}\n{{body}}\n", $params);
	Q::log($logMessage, Q_Config::get('Users', 'email', 'logKey', 'email'), array(
		"maxLength" => 2048
	));
}