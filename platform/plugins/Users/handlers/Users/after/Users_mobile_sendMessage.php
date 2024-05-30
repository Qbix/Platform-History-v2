<?php

function Users_after_Users_mobile_sendMessage($params)
{
	$logMessage = Q::interpolate("Sent message to {{number}}:\n{{body}}\n", $params);
	Q::log($logMessage, Q_Config::get('Users', 'mobile', 'logKey', 'SMS'));
}