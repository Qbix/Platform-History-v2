<?php

function Streams_0_8_4_Streams_mysql()
{	
	$app = Q::app();
	$communityId = Users::communityId();
	$user = Users_User::fetch($communityId);
	
	// avatar for the App user
	$avatar = new Streams_Avatar();
	$avatar->toUserId = $communityId;
	$avatar->publisherId = $communityId;
	$avatar->username = $user->username;
	$avatar->firstName = '';
	$avatar->lastName = '';
	$avatar->icon = $user->icon;
	$avatar->save();

	$avatar2 = new Streams_Avatar();
	$avatar2->copyFrom($avatar, null, false, true);
	$avatar->toUserId = '';
	$avatar->save();
	
	// access stream for managing app roles
	$stream = new Streams_Stream();
	$stream->publisherId = Users::communityId();
	$stream->name = 'Streams/contacts';
	$stream->type = 'Streams/resource';
	$stream->title = "Contacts";
	$stream->setAttribute('prefixes', array("Users/", "$app/"));
	$stream->save();
	
	// access stream for managing app roles
	$stream = new Streams_Stream();
	$stream->publisherId = $app;
	$stream->name = 'Streams/labels';
	$stream->type = 'Streams/resource';
	$stream->title = "Labels";
	$stream->setAttribute('prefixes', array("Users/", "$app/"));
	$stream->save();
	
	// access for managing app contacts
	$access = new Streams_Access();
	$access->publisherId = $communityId;
	$access->streamName = 'Streams/contacts';
	$access->ofUserId = '';
	$access->ofContactLabel = "$app/admins";
	$access->readLevel = Streams::$READ_LEVEL['messages'];
	$access->writeLevel = Streams::$WRITE_LEVEL['edit'];
	$access->adminLevel = Streams::$ADMIN_LEVEL['manage'];
	$access->save();
	
	// access for managing app roles
	$access = new Streams_Access();
	$access->publisherId = $communityId;
	$access->streamName = 'Streams/labels';
	$access->ofUserId = '';
	$access->ofContactLabel = "$app/admins";
	$access->readLevel = Streams::$READ_LEVEL['messages'];
	$access->writeLevel = Streams::$WRITE_LEVEL['edit'];
	$access->adminLevel = Streams::$ADMIN_LEVEL['manage'];
	$access->save();
}

Streams_0_8_4_Streams_mysql();