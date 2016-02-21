<?php

function Websites_before_Streams_Stream_save_Websites_article($params)
{
	$stream = $params['stream'];
	$modifiedFields = $params['modifiedFields'];
	if ($stream->wasRetrieved()) return;

	$user = new Users_User();
	if (empty($stream->userId) and empty($modifiedFields['userId'])) {
		if ($liu = Users::loggedInUser()) {
			$stream->userId = $liu->id;
		} else {
			throw new Q_Exception_RequiredField(array('field' => 'userId'));
		}
	}
	$user->id = $stream->userId;
	if (!$user->retrieve()) {
		throw new Users_Exception_NoSuchUser();
	}

	$title = Streams::displayName($user, array('fullAccess' => true));
	if (isset($title)) {
		$stream->title = $title;
	}
	$stream->icon = $user->iconUrl();
	$s = Streams::fetchOne($user->id, $user->id, "Streams/user/icon");
	if (!$s or !$sizes = $s->getAttribute('sizes', null)) {
		$sizes = Q_Config::expect('Users', 'icon', 'sizes');
		sort($sizes);
	}
	$stream->setAttribute('sizes', $sizes);
}