<?php

function Users_after_Users_setMobileNumber($params)
{
	Users::saveContactsFromLinks(array(
		'mobile' => $params['mobile']->number,
		'mobile_hashed' => Q_Utils::hash($params['mobile']->number)
	), $params['user']->id);
}