<?php

function Users_after_Users_setEmailAddress($params)
{
	Users::saveContactsFromLinks(array(
		'emailAddress' => $params['email']->address,
		'emailAddress_hashed' => Q_Utils::hash($params['email']->address)
	), $params['user']->id);
}