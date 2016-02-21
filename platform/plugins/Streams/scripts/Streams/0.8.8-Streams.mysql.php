<?php

function Streams_0_8_8_Streams_mysql()
{
	$app = Q_Config::expect('Q', 'app');
	$user = Users_User::fetch($app, true);
	
	Streams::create($app, $app, 'Streams/resource', array(
		'name' => 'Streams/invitations',
		'readLevel' => 0,
		'writeLevel' => 0,
		'adminLevel' => 0
	));
	Streams_Access::insert(array(
		'publisherId' => $app, 
		'streamName' => "Streams/invitations",
		'ofUserId' => '',
		'grantedByUserId' => null,
		'ofContactLabel' => "$app/admins",
		'readLevel' => Streams::$READ_LEVEL['messages'], 
		'writeLevel' => Streams::$WRITE_LEVEL['close'], 
		'adminLevel' => Streams::$ADMIN_LEVEL['invite']
	))->execute();
}

Streams_0_8_8_Streams_mysql();