<?php

function Users_after_Users_setEmailAddress($params)
{
	Users::saveContactsFromLinks(array(
		'email' => $params['email']->address,
		'email_hashed' => Q_Utils::hash($params['email']->address)
	), $params['user']->id);
}