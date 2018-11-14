<?php
// add 'type' column to users_user table (if not exist)
$db = Db::connect('Users');
$tableName = Users_User::table();
$cols = $db->rawQuery("SHOW COLUMNS FROM ".$tableName." like 'type'")->execute()->fetchAll(PDO::FETCH_ASSOC);
if (!$cols) {
	$db->rawQuery("ALTER TABLE ".$tableName." ADD COLUMN type varchar(50) NOT NULL DEFAULT 'person' AFTER username")->execute();

	// generate Models for Users plugin
	$db->generateModels(Q_DIR.DS.'plugins'.DS.'Users'.DS.'classes');
}

// set type=community for all communities users
$communities = $db->rawQuery("select id from ".$tableName." where type='person' and signedUpWith='none'")->fetchDbRows();
foreach($communities as $community) {
	if (ctype_upper($community->id{0})) {
		// need to use rawQuery because models doesn't updated yet
		$db->rawQuery("update ".$tableName." set type='community' where id='".$community->id."'")->execute();
	}
}


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

	// need to use rawQuery because models doesn't updated yet
	$db->rawQuery("update ".$tableName." set type='plugin' where id='".$user->id."'")->execute();

	echo "\t" . 'user created successfully' . PHP_EOL;
}
