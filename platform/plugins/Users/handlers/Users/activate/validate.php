<?php

function Users_activate_validate()
{
	$uri = Q_Dispatcher::uri();
	$emailAddress = Q::ifset($_REQUEST, 'e', Q::ifset($_REQUEST, 'emailAddress', $uri->emailAddress));
	$mobileNumber = Q::ifset($_REQUEST, 'm', Q::ifset($_REQUEST, 'mobileNumber', $uri->mobileNumber));
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
	if (!$emailAddress and !$mobileNumber) {
		throw new Q_Exception("The email address or mobile number is required");
	}
	if (!empty($e_normalized)) {
		Users::$cache['emailAddress'] = $e_normalized;
	}
	if (!empty($m_normalized)) {
		Users::$cache['mobileNumber'] = $m_normalized;
	}
}
