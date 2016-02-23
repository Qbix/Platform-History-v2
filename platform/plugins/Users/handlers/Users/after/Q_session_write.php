<?php

function Users_after_Q_session_write($params)
{
	Q::$state['session'] = true;
	if (!$params['changed']) {
		return;
	}
	// Q::autoload('Db');
	// Q::autoload('Db_Mysql');
	// Q::autoload('Db_Result');
	// Q::autoload('Db_Expression');
	// Q::autoload('Db_Query');
	// Q::autoload('Db_Query_Mysql');
	// Q::autoload('Db_Row');
	// Q::autoload('Base_Users_Session');
	// Q::autoload('Base_Users');
	// Q::autoload('Users');
	Q::autoload('Q_Utils');
	Q::autoload('Q_Config');
	Q::autoload('Q_Session');

	$id = Q_Session::id();
	if (!$id) {
		return;
	}
	$parts = explode('-', $id);
	$duration = (count($parts) > 1) ? $parts[0] : 0;
	$content = Q::json_encode($_SESSION, JSON_FORCE_OBJECT);

	if (Users::$loggedOut) {
		Q_Utils::sendToNode(array(
			"Q/method" => "Users/session", 
			"sessionId" => $id, 
			"content" => null, 
			"duration" => $duration
		));
	} else if (Q_Session::id() and !empty($_SERVER['HTTP_HOST'])) {
		try {
			Q_Utils::sendToNode(array(
				"Q/method" => "Users/session",
				"sessionId" => $id,
				"content" => $content,
				"duration"=>$duration
			));
		} catch (Exception $e) {
			// don't throw here, it would only result in a mysterious fatal error
		}
	}
}
