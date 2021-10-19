<?php

function Streams_basic_validate()
{
	Q_Valid::nonce(true);
	if (Q_Request::method() !== 'POST') {
		return;
	}
	$fields = array(
		'firstName' => 'First name', 
		'lastName' => 'Last name', 
		'gender' => 'Gender', 
		'birthday_month' => 'Month', 
		'birthday_day' => 'Day', 
		'birthday_year' => 'Year'
	);
	if (isset($_REQUEST['fullName'])) {
		$length_min = Q_Config::get('Streams', 'inputs', 'fullName', 'lengthMin', 5);
		$length_max = Q_Config::get('Streams', 'inputs', 'fullName', 'lengthMax', 30);
		if (strlen($_REQUEST['fullName']) < $length_min) {
			Q_Response::addError(new Q_Exception("Your full name can't be that short.", 'fullName'));
		}
		if (strlen($_REQUEST['fullName']) > $length_max) {
			Q_Response::addError(new Q_Exception("Your full name can't be that long.", 'fullName'));
		}		
	}
	if (Q_Response::getErrors()) {
		return;
	}
	if (!empty($_REQUEST['birthday_month']) or !empty($_REQUEST['birthday_day']) or !empty($_REQUEST['birthday_year'])) {
		foreach (array('birthday_month', 'birthday_day', 'birthday_year') as $field) {
			if (empty($_REQUEST[$field]) or !trim($_REQUEST[$field])) {
				throw new Q_Exception_RequiredField(@compact('field'), $field);
			}
		}
		if (!checkdate(
			$_REQUEST['birthday_month'],
			$_REQUEST['birthday_day'],
			$_REQUEST['birthday_year']
		)) {
			Q_Response::addError(new Q_Exception("Not a valid date", "birthday_day"));
		}
		if ($_REQUEST['birthday_year'] > date('Y') - 13) { // compliance with COPPA
			Q_Response::addError(new Q_Exception("You're still a kid.", "birthday_year"));
		}
		if ($_REQUEST['birthday_year'] < date('Y') - 100) {
			Q_Response::addError(new Q_Exception("A world record? Really?", "birthday_year"));
		}
	}
	if (!empty($_REQUEST['gender'])) {
		if (!in_array($_REQUEST['gender'], array('male', 'female', 'other'))) {
			Q_Response::addError(new Q_Exception("Please enter male, female or other", "gender"));
		}
	}
}
