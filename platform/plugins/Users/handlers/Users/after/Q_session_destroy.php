<?php

function Users_after_Q_session_destroy($params)
{
	Q::$state['session'] = true;
	//  Q::autoload('Db');
	//  Q::autoload('Db_Mysql');
	//  Q::autoload('Db_Result');
	//  Q::autoload('Db_Expression');
	//  Q::autoload('Db_Query');
	//  Q::autoload('Db_Query_Mysql');
	//  Q::autoload('Db_Row');
	//  Q::autoload('Base_Users_Session');
	//  Q::autoload('Base_Users');
	//  Q::autoload('Users');
	Q::autoload('Q_Utils');
	Q::autoload('Q_Config');
	Q::autoload('Q_Session');

	$id = Q_Session::id();
	if (!$id) {
		return;
	}
	$content = Q::json_encode($_SESSION, JSON_FORCE_OBJECT);

	Q_Utils::sendToNode(array(
		"Q/method" => "Users/session", 
		"sessionId" => $id, 
		"content"=>null, 
		"updatedTime"=>null,
		"destroyed"=>true
	));
}
