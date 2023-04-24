<?php

function Users_0_9_4_Users()
{
	echo "Adding labels for users...";
	$users = Users_User::select()->fetchDbRows();
	$c = count($users);
	$i = 0;
	$labels = Q_Config::get('Users', 'onInsert', 'labels', array());
	foreach ($users as $user) {
		// skip labels for community
		if (Users::isCommunityId($user->id)) {
			continue;
		}

		Users_Label::addLabel($labels, $user->id, null, null, $user->id, true);
		++$i;
		echo "\033[100D";
		echo "Added labels for $i of $c users";
	}
	echo "\n";
}

Users_0_9_4_Users();