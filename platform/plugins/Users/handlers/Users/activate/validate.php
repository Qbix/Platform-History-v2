<?php

function Users_activate_validate()
{
	$uri = Q_Dispatcher::uri();
	$emailAddress = Q::ifset($_REQUEST, 'e', $uri->emailAddress);
	$mobileNumber = Q::ifset($_REQUEST, 'm', $uri->mobileNumber);
	if ($emailAddress && !Q_Valid::email($emailAddress, $e_normalized, array('no_ip' => 'false'))) {
		throw new Q_Exception_WrongValue(array(
			'field' => 'email',
			'range' => 'a valid email address'
		), 'emailAddress');
	}
	if ($mobileNumber && !Q_Valid::phone($mobileNumber, $m_normalized)) {
		throw new Q_Exception_WrongValue(array(
			'field' => 'mobile phone',
			'range'	=> 'a valid phone number'
		), 'mobileNumber');
	}
	if ($emailAddress or $mobileNumber) {
		if (empty($_REQUEST['code'])) {
			throw new Q_Exception("The activation code is missing");
		}
	} else {
		throw new Q_Exception("The contact information is missing");
	}
	if (!empty($e_normalized)) {
		Users::$cache['emailAddress'] = $e_normalized;
	}
	if (!empty($m_normalized)) {
		Users::$cache['mobileNumber'] = $m_normalized;
	}
}
