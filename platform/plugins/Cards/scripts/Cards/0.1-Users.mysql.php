<?php

function Users_0_1_Streams_mysql()
{
	$users = Users_User::select()
			->where(array('signedUpWith !=' => 'none'))
			->limit(100, $offset)
			->fetchDbRows();
	if (!$users) {
		break;
	}
	foreach ($users as $user) {
		if (Users::isCommunityId($user->id)) { continue; }
		
        $streams = new Streams_Stream();
        $streams->publisherId = $user->id;
        $streams->name = "Cards/businessCard";
        if ($streams->retrieve()) {
            continue;
		}
		
		Streams::create($user->id, $user->id, "Cards/businessCard", array(
			"name" => "Cards/businessCard"
		));
	}
	$offset += 100;
}

Users_0_1_Streams_mysql();