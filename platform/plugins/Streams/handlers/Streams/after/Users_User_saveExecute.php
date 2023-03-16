<?php

function Streams_after_Users_User_saveExecute($params)
{
	static $processing;
	if ($processing) {
		return;
	}
	$processing = true;
	$prevAllowCaching = Db::allowCaching(false);

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
		Db::allowCaching($prevAllowCaching);
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
	if (!Users::isCustomIcon($user->icon) // latest icon of saved user row
	and !$user->get('leaveDefaultIcon', false)
	and !$user->get('skipIconSearch', false)
	and $search = Q_Config::get('Users', 'register', 'icon', 'search', array())) {
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

				foreach ($results as $result) {
					if (!@getimagesize($result)) {
						continue;
					}

					$icon = Q_Image::iconArrayWithUrl($result, 'Users/icon');
					$cookie = Q_Config::get('Q', 'images', $service, 'cookie', null);
					Users::importIcon($user, $icon, null, $cookie);
					$user->save();
					$values['Streams/user/icon'] = $modifiedFields['icon'] = $updates['icon'] = $user->icon;
					break 2;
				}
			} catch (Exception $e) {}
		}
	}
	$toInsert = array();
	if ($params['inserted'] && !$user->get('skipInsertingStreams', false)) {
		$onInsert = Q_Config::get('Streams', 'onInsert', array());
		$personOrCommunity = Users::isCommunityId($user->id) ? 'community' : 'person';
		$toInsert = array_merge(
			Q::ifset($onInsert, 'user', array()),
			Q::ifset($onInsert, $personOrCommunity, array())	
		);
	}
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
		}

		// use try/catch to avoid crush of whole streams creation process because of error in some configs
		try {
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
		} catch (Exception $e) {
			continue;
		}
		if ($name === 'Streams/user/icon') {
			$sizes = Q_Image::getSizes('Users/icon');
			ksort($sizes);
			$s['attributes']['sizes'] = $sizes;
			$s['attributes']['icon'] = $user->icon;
		} elseif ($name === 'Streams/user/xid/web3') {
			$json = null;
			try {
				$json = json_decode($user->xids, true);
			} catch (Exception $e) {}
			$s['content'] = Q::ifset($json, "web3_all", null);
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
	usleep(1); // garbage collection
	
	if ($params['inserted']) {
		
		// Save a greeting stream, to be edited
		$communityId = Users::communityId();
		$name = "Streams/greeting/$communityId";
		$stream = Streams_Stream::fetch($user->id, $user->id, $name, array('dontCache' => true));

		if (!$stream) {
			Streams::create($user->id, $user->id, "Streams/greeting", @compact('name'));

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
		
	}

	if ($modifiedFields) {
		if ($updates) {
			Streams_Avatar::update()
				->set($updates)
				->where(array('publisherId' => $user->id))
				->execute();
		}

		$names = Q_Config::get('Streams', 'onUpdate', 'Users_User', array());
		foreach ($modifiedFields as $field => $value) {
			if (!in_array($field, $names) && !Q::ifset($names, $field, null)) {
				continue;
			}

			// when email or mobile move from pending to actual field, skip empty pending values
			if (empty($value) && in_array($field, array("emailAddressPending", "mobileNumberPending"))) {
				continue;
			}

			$name = $names[$field];
			if (is_array($name)) {
				foreach ($name as $streamName) {
					$stream = Streams_Stream::fetch($user->id, $user->id, $streamName);
					if (!$stream) {
						continue;
					}

					$json = null;
					try {
						$json = json_decode($value, true);
					} catch (Exception $e) {}

					if ($streamName == "Streams/user/xid/web3") {
						$stream->content = Q::ifset($json, "web3_all", null);
					}

					Streams::$beingSavedQuery = $stream->changed($user->id);
				}
			} else {
				$stream = isset(Streams::$beingSaved[$field])
					? Streams::$beingSaved[$field]
					: Streams_Stream::fetch($user->id, $user->id, $name);
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
	}

	Db::allowCaching($prevAllowCaching);

	$processing = false;
}