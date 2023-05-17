<?php

function Users_0_8_4_Users_mysql()
{
	$app = Q::app();
	$communityId = Users::communityId();
	Users_Label::addLabel("$app/admins", $communityId, "$app Admins", "labels/Users/admins");
}

Users_0_8_4_Users_mysql();