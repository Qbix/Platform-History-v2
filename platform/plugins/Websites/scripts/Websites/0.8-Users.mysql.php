<?php

function Websites_0_8_Users_mysql()
{
	$userId = Users::communityId();
	
	Users_Label::addLabel('Websites/admins', $userId, 'Website Admins', 'labels/Websites/admins');
}

Websites_0_8_Users_mysql();