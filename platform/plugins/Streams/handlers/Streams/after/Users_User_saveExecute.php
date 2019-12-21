<?php

function Streams_after_Users_User_saveExecute($params)
{
	static $processing;
	if ($processing) {
		return;
	}
	$processing = true;

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
	if (isset($modifiedFields['emailAddress'])) {
		if ($emailStream = Streams::fetchOne($user->id, $user->id, 'Streams/user/emailAddress')) {
			$emailStream->content = $user->emailAddress;
			$emailStream->changed();
		}
	}
	if (isset($modifiedFields['mobileNumber'])) {
		if ($mobileStream = Streams::fetchOne($user->id, $user->id, 'Streams/user/mobileNumber')) {
			$mobileStream->content = $user->mobileNumber;
			$mobileStream->changed();
		}
	}

	// if we only modified some inconsequential fields, no need to proceed
	$mf = $modifiedFields;
	unset($mf['updatedTime']);
	unset($mf['signedUpWith']);
	unset($mf['pincodeHash']);
	unset($mf['emailAddressPending']);
	unset($mf['mobileNumberPending']);
	unset($mf['sessionId']);
	unset($mf['sessionCount']);
	unset($mf['insertedTime']);
	if (empty($mf)) {
		$processing = false;
		return;
	}

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
	if (!empty($updates['icon'])) {
		$values['Streams/user/icon'] = $modifiedFields['icon'] = $updates['icon'];
	}
	if (!$user->get('leaveDefaultIcon', false)
	and !$user->get('skipIconSearch', false)
	and $search = Q_Config::get('Users', 'icon', 'search', array())
	and !Users::isCustomIcon($user->icon)) {
		foreach ($search as $service) {
			try {
				$fullName = Q::ifset(Streams::$cache, 'fullName', null);

				if (!$fullName) {
					continue;
				}

				$query = $fullName['first'] . ' ' . $fullName['last'];
				$results = call_user_func(
					array('Q_Image', $service), $query, array(), false
				);
				if ($src = reset($results)) {
					$icon = Q_Image::iconArrayWithUrl($src, 'Users/icon');
					$cookie = Q_Config::get('Q', 'images', $service, 'cookie', null);
					Users::importIcon($user, $icon, null, $cookie);
					$user->save();
					$values['Streams/user/icon'] = $modifiedFields['icon'] = $user->icon;
					break;
				}
			} catch (Exception $e) {
			}
		}
	}
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
	$rows = Streams_Stream::select('name')->where(array(
		'publisherId' => $user->id,
		'name' => $toInsert
	))->ignoreCache()->fetchAll(PDO::FETCH_ASSOC);
	$existing = array();
	foreach ($rows as $row) {
		$existing[$row['name']] = true;
	}
	$toCreate = array();
	foreach ($toInsert as $name) {
		if (!empty($existing[$name])) {
			continue;
			$stream = new Streams_Stream();
			$stream->publisherId = $user->id;
			$stream->name = $name;
		}
		$s = array(
			'publisherId' => $user->id,
			'name' => $name,
			'type' => $p->expect($name, 'type'),
			'title' => $p->expect($name, 'title'),
			'content' => ($userField = $p->get($name, 'userField', null))
				? $user->$userField
				: $p->get($name, "content", ''), // usually empty
			'attributes' => $p->get($name, 'attributes', array()),
			'readLevel' => $p->get($name, 'readLevel', Streams_Stream::$DEFAULTS['readLevel']),
			'writeLevel' => $p->get($name, 'writeLevel', Streams_Stream::$DEFAULTS['writeLevel']),
			'adminLevel' => $p->get($name, 'adminLevel', Streams_Stream::$DEFAULTS['adminLevel'])
		);
		if ($name === 'Streams/user/icon') {
			$sizes = Q_Image::getSizes('Users/icon');
			ksort($sizes);
			$s['attributes']['sizes'] = $sizes;
			$s['attributes']['icon'] = $user->icon;
		}
		if (isset($values[$name])) {
			$s['content'] = $values[$name];
			if ($s['type'] === 'Streams/image') {
				$s['icon'] = $s['content'];
			}
		}
		$toCreate[$name] = $s;
		if ($so[$name] = $p->get($name, "subscribe", array())) {
			$streamsToSubscribe[] = $name;
		} else {
			$streamsToJoin[] = $name;
		}
	}
	Streams::createStreams($user->id, $user->id, $toCreate);
	Streams::join($user->id, $user->id, $streamsToJoin);
	Streams::subscribe($user->id, $user->id, $streamsToSubscribe, array('skipAccess' => true));
	
	if ($params['inserted']) {
		
		// Save a greeting stream, to be edited
		$communityId = Users::communityId();
		$name = "Streams/greeting/$communityId";
		$stream = Streams::fetchOne($user->id, $user->id, $name);
		if (!$stream) {
			Streams::create($user->id, $user->id, "Streams/greeting", compact('name'));

			$text = Q_Text::get('Streams/content', array(
				'language' => Q::ifset($user, 'preferredLanguage', null)
			));

			// Create some standard labels
			$label = new Users_Label();
			$label->userId = $user->id;
			$label->label = 'Streams/invited';
			$label->icon = 'labels/Streams/invited';
			$label->title = $text['labels']['Streams/invited'];
			$label->save(true);

			$label2 = new Users_Label();
			$label2->userId = $user->id;
			$label2->label = 'Streams/invitedMe';
			$label2->icon = 'labels/Streams/invitedMe';
			$label2->title = $text['labels']['Streams/invitedMe'];
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
			if ($stream->type === 'Streams/image') {
				$stream->icon = $value;
			}
			if ($name === "Streams/user/icon") {
                $sizes = Q_Image::getSizes('Users/icon');
				ksort($sizes);
                $stream->setAttribute('sizes', $sizes);
			}
			Streams::$beingSavedQuery = $stream->changed($user->id);
		}
	}

	$processing = false;
}