<?php

function Streams_after_Users_User_saveExecute($params)
{
	// If the username or icon was somehow modified,
	// update all the avatars for this publisher
	$modifiedFields = $params['modifiedFields'];
	$user = $params['row'];
	$updates = array();
	if (isset($modifiedFields['username'])) {
		$updates['username'] = $modifiedFields['username'];
	}
	if (isset($modifiedFields['icon'])) {
		$updates['icon'] = $modifiedFields['icon'];
	}

	$skipExistingOnInsert = $user->get('Streams', 'skipExistingOnInsert', null);

	// some standard values
	if (!empty(Streams::$cache['fullName'])) {
		$fullName = Streams::$cache['fullName'];
		$firstName = Q::ifset($fullName, 'first', '');
		$lastName = Q::ifset($fullName, 'last', '');
	} else {
		$firstName = null;
		$lastName = null;
	}
	$values = array(
		'Streams/user/firstName' => $firstName,
		'Streams/user/lastName' => $lastName
	);
	$toInsert = $params['inserted']
		? Q_Config::get('Streams', 'onInsert', 'Users_User', array())
		: array();
	$p = Streams::userStreamsTree();
	if (!empty(Users::$cache['platformUserData'])) {
		$infos = $p->getAll();
		// check for user data from various platforms
		foreach (Users::$cache['platformUserData'] as $platform => $userData) {
			foreach ($userData as $k => $v) {
				foreach ($infos as $name => $info) {
					if (isset($info['platforms'][$platform])) {
						$n = $info['platforms'][$platform];
						if (is_array($n)) {
							$parts = explode($n[1], $v);
							$v = $parts[$n[2]];
							$n = $n[0];
						}
						if ($n === $k) {
							$toInsert[] = $name;
							$values[$name] = $v;
							break;
						}
					}
				}
			}
		}
	}
	if (!empty(Users::$cache['importUserData'])) {
		// check for user data from import
		foreach (Users::$cache['importUserData'] as $k => $v) {
			if (!in_array($k, $toInsert)) {
				$toInsert[] = $k;
			}
			$values[$k] = $v;
		}
	}
	
	$jo = array();
	$so = array();
	$streamsToJoin = array();
	$streamsToSubscribe = array();
	foreach ($toInsert as $name) {
		$stream = Streams::fetchOne($user->id, $user->id, $name);
		if (!$stream) {
			$stream = new Streams_Stream();
			$stream->publisherId = $user->id;
			$stream->name = $name;
		} else if ($skipExistingOnInsert) {
			continue;
		}
		$stream->type = $p->expect($name, "type");
		$stream->title = $p->expect($name, "title");
		if ($userField = $p->get($name, 'userField', null)) {
			$stream->content = $user->$userField;
		} else {
			$stream->content = $p->get($name, "content", ''); // usually empty
		}
		$stream->readLevel = $p->get($name, 'readLevel', Streams_Stream::$DEFAULTS['readLevel']);
		$stream->writeLevel = $p->get($name, 'writeLevel', Streams_Stream::$DEFAULTS['writeLevel']);
		$stream->adminLevel = $p->get($name, 'adminLevel', Streams_Stream::$DEFAULTS['adminLevel']);
		if ($name === "Streams/user/icon") {
			$sizes = Q_Config::expect('Users', 'icon', 'sizes');
			sort($sizes);
			$stream->setAttribute('sizes', $sizes);
			$stream->icon = $user->icon;
		}
		if (isset($values[$name])) {
			$stream->content = $values[$name];
		}
		$stream->save(); // this also inserts avatars
		$streams[$name] = $stream;
		if ($so[$name] = $p->get($name, "subscribe", array())) {
			$streamsToSubscribe[$name] = $stream;
		} else {
			$streamsToJoin[$name] = $stream;
		}
	}
	Streams::join($user->id, $user->id, $streamsToJoin, array('skipAccess' => true));
	foreach ($streamsToSubscribe as $name => $stream) {
		$stream->subscribe(array_merge($so[$name], array(
			'userId' => $user->id, 
			'skipAccess' => true)
		));
	}
	
	if ($params['inserted']) {
		
		// Save a greeting stream, to be edited
		$communityId = Users::communityId();
		$name = "Streams/greeting/$communityId";
		$stream = Streams::fetchOne($user->id, $user->id, $name);
		if (!$stream) {
			Streams::create($user->id, $user->id, "Streams/greeting", compact('name'));

			// Create some standard labels
			$label = new Users_Label();
			$label->userId = $user->id;
			$label->label = 'Streams/invited';
			$label->icon = 'labels/Streams/invited';
			$label->title = 'People I invited';
			$label->save(true);

			$label2 = new Users_Label();
			$label2->userId = $user->id;
			$label2->label = 'Streams/invitedMe';
			$label2->icon = 'labels/Streams/invitedMe';
			$label2->title = 'Who invited me';
			$label2->save(true);

			// By default, users they invite should see their full name
			$access = new Streams_Access();
			$access->publisherId = $user->id;
			$access->streamName = 'Streams/user/firstName';
			$access->ofUserId = '';
			$access->ofContactLabel = 'Streams/invited';
			$access->grantedByUserId = $user->id;
			$access->readLevel = Streams::$READ_LEVEL['content'];
			$access->writeLevel = -1;
			$access->adminLevel = -1;
			$access->save(true);

			$access = new Streams_Access();
			$access->publisherId = $user->id;
			$access->streamName = 'Streams/user/lastName';
			$access->ofUserId = '';
			$access->ofContactLabel = 'Streams/invited';
			$access->grantedByUserId = $user->id;
			$access->readLevel = Streams::$READ_LEVEL['content'];
			$access->writeLevel = -1;
			$access->adminLevel = -1;
			$access->save(true);

			// NOTE: the above saving of access caused Streams_Avatar::updateAvatar
			// to run, to insert a Streams_Avatar row for the new user, and
			// to properly configure it.
		}
		
	} else if ($modifiedFields) {
		if ($updates) {
			Streams_Avatar::update()
				->set($updates)
				->where(array('publisherId' => $user->id))
				->execute();
		}
		
		foreach ($modifiedFields as $field => $value) {
			$name = Q_Config::get('Streams', 'onUpdate', 'Users_User', $field, null);
			if (!$name) continue;
			$stream = isset(Streams::$beingSaved[$field])
				? Streams::$beingSaved[$field]
				: Streams::fetchOne($user->id, $user->id, $name);
			if (!$stream) { // it should probably already be in the db
				continue;
			}
			$stream->content = $value;
			if ($name === "Streams/user/icon") {
                $sizes = Q_Config::expect('Users', 'icon', 'sizes');
				sort($sizes);
                $stream->setAttribute('sizes', $sizes);
				$stream->icon = $changes['icon'] = $user->icon;
			}
			Streams::$beingSavedQuery = $stream->changed($user->id);
		}
	}
}