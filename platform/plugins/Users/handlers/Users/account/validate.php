<?php

function Users_account_validate()
{
	Q_Valid::nonce(true);

    $birthday_year = $birthday_month = $birthday_day = null;
    extract($_REQUEST);

    $field_names = array(
		'firstName' => 'First name',
		'lastName' => 'Last name',
		'username' => 'Username',
		'gender' => 'Your gender',
		'desired_gender' => 'Gender preference',
		'orientation' => 'Orientation',
		'relationship_status' => 'Status',
		'zipcode' => 'Zipcode'
    );
    foreach ($field_names as $name => $label) {
		if (isset($_POST[$name]) and !($_POST[$name])) {
			Q_Response::addError(
				new Q_Exception_RequiredField(array('field' => $label), $name)
			);
		}
    };

    if (isset($birthday_year)) {
		if (!checkdate($birthday_month, $birthday_day, $birthday_year)) {
		$field = 'Birthday';
		$range = 'a valid date';
			Q_Response::addError(
				new Q_Exception_WrongValue(compact('field', 'range'), 'birthday')
			);
		}
    }
	global $Q_installing;
    if (isset($username) and isset($Q_installing)) {
        try {
			Q::event('Users/validate/username', compact('username'));
        } catch (Exception $e) {
			Q_Response::addError($e);
        }
    }
}


