<?php

function Users_0_8_3_Users_mysql()
{
	$app = Q::app();
	$communityId = Users::communityId();
	$communityName = Q_Config::get('Users', 'community', 'name', $app);
	$appRootUrl = Q_Config::expect('Q', 'web', 'appRootUrl');
	
	$user = new Users_User();
	$user->id = $communityId;
	$user->username = $communityName;
	$user->url = $appRootUrl;
	$user->icon = "{{baseUrl}}/img/icon";
	$user->signedUpWith = 'none';
	$user->save();
}

Users_0_8_3_Users_mysql();