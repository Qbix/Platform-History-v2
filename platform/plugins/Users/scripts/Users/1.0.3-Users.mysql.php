<?php
$plugins = Q_Config::expect('Q', 'plugins');

foreach($plugins as $plugin) {
	$user = new Users_User();
	$user->id = ucfirst(Q_Utils::normalize(ucwords($plugin), '', null, $user->maxSize_id(), true));

	echo 'Started user ' . $user->id . PHP_EOL;

	// skip if user already exist
	if ($user->retrieve()) {
		echo "\t" . 'user with this id already exist' . PHP_EOL;
		continue;
	}
	$user->username = $plugin;
	$user->icon = "{{baseUrl}}/img/icons/".$user->id;
	$user->signedUpWith = 'none';
	$user->save();

	echo "\t" . 'user created successfully' . PHP_EOL;
}
