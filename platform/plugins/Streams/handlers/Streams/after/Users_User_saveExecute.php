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
	if ($user->id === Users::communityId()) {
		$firstName = Users::communityName();
		$lastName = Users::communitySuffix();
		$firstName = $firstName ? $firstName : "";
		$lastName = $lastName ? $lastName : "";
	} else {
		$firstName = Q::ifset(Streams::$cache, 'register', 'first', '');
		$lastName = Q::ifset(Streams::$cache, 'register', 'last', '');
	}
	if ($params['inserted']) {
		
		// create some standard streams for them
		$onInsert = Q_Config::get('Streams', 'onInsert', 'Users_User', array());
		if (!$onInsert) {
			return;
		}
		$p = new Q_Tree();
		$p->load(STREAMS_PLUGIN_CONFIG_DIR.DS.'streams.json');
		$p->load(APP_CONFIG_DIR.DS.'streams.json');
	
		$values = array(
			'Streams/user/firstName' => $firstName,
			'Streams/user/lastName' => $lastName,
		);
	
		// Check for user data from facebook
		if (!empty(Users::$cache['facebookUserData'])) {
			$userData = Users::$cache['facebookUserData'];
			foreach ($userData as $name_fb => $value) {
				foreach ($p->getAll() as $name => $info) {
					if (isset($info['name_fb'])
					and $info['name_fb'] === $name_fb) {
						$onInsert[] = $name;
						$values[$name] = $value;
					}
				}
			}
		}
	
		foreach ($onInsert as $name) {
			$stream = Streams::fetchOne($user->id, $user->id, $name);
			if (!$stream) { // it shouldn't really be in the db yet
				$stream = new Streams_Stream();
				$stream->publisherId = $user->id;
				$stream->name = $name;
			}
			$stream->type = $p->expect($name, "type");
			$stream->title = $p->expect($name, "title");
			$stream->content = $p->get($name, "content", ''); // usually empty
			$stream->readLevel = $p->get($name, 'readLevel', Streams_Stream::$DEFAULTS['readLevel']);
			$stream->writeLevel = $p->get($name, 'writeLevel', Streams_Stream::$DEFAULTS['writeLevel']);
			$stream->adminLevel = $p->get($name, 'adminLevel', Streams_Stream::$DEFAULTS['adminLevel']);
			if ($name === "Streams/user/icon") {
				$sizes = Q_Config::expect('Users', 'icon', 'sizes');
				sort($sizes);
				$stream->setAttribute('sizes', $sizes);
				$stream->icon = $user->iconUrl();
			}
			if (isset($values[$name])) {
				$stream->content = $values[$name];
			}
			$stream->save(); // this also inserts avatars
			$stream->join(array(
				'userId' => $user->id, 
				'skipAccess' => true
			));
		}
		
		// Save a greeting stream, to be edited
		$communityId = Users::communityId();
		Streams::create($user->id, $user->id, "Streams/greeting", array(
			'name' =>"Streams/greeting/$communityId"
		));
	
		// Create some standard labels
		// This also allows the users being invited to have access to
		// Streams/user/firstName and Streams/user/lastName streams
		// of the user inviting them.
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
				$attributes = $stream->attributes;
                $stream->setAttribute('sizes', $sizes);
				$stream->icon = $changes['icon'] = $user->iconUrl();
			}
			Streams::$beingSavedQuery = $stream->changed($user->id);
		}
	}
}