<?php

function Users_authorize_validate()
{
	$bad_fields = array();
	foreach (array('client_id', 'redirect_uri', 'scope', 'state') as $field) {
		if (empty($_REQUEST[$field])) {
			Q_Response::addError(new Q_Exception_RequiredField(compact('field'), $field));
			$bad_fields[$field] = true;
		}
	}
	if (empty($_REQUEST['response_type']) or $_REQUEST['response_type'] !== 'token') {
		Q_Response::addError(new Q_Exception_WrongValue(
			array('field' => 'response_type', 'range' => '"token"'), 
			'response_type'
		));
	}
	$min_length = Q_Config::expect('Users', 'authorize', 'stateMinLength');
	if (!empty($_REQUEST['state']) and strlen($_REQUEST['state']) < $min_length) {
		Q_Response::addError(new Q_Exception_WrongValue(
			array('field' => 'state', 'range' => "at least $min_length characters"), 
			'state'
		));
	}
}