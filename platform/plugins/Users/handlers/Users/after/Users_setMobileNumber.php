<?php

function Users_after_Users_setMobileNumber($params)
{
	Users::saveContactsFromLinks(array(
		'mobileNumber' => $params['mobile']->number,
		'mobileNumber_hashed' => Q_Utils::hash($params['mobile']->number)
	), $params['user']->id);
}