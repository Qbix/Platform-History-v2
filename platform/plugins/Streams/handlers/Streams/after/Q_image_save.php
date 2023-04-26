<?php

function Streams_after_Q_image_save($params)
{
	$user = Q::ifset(Users::$cache, 'user', Users::loggedInUser(false, false));
	if (!$user) {
		return;
	}
	$subpath = null;
	$data = $save = array();
	extract($params, EXTR_OVERWRITE);
	if (isset(Users::$cache['iconUrlWasChanged'])
	and (Users::$cache['iconUrlWasChanged'] === false)) {
		// the logged-in user's icon was changed without the url changing
		$stream = Streams_Stream::fetch($user->id, $user->id, "Streams/user/icon");
	} else if (!empty(Streams::$cache['canWriteToStream'])) {
		// some stream's icon was being changed
		$stream = Streams::$cache['canWriteToStream'];
	}
	if (empty($stream)) {
		return;
	}
	$url = $data[''];
	$stream->icon = Q_Valid::url($url) ? $url : '{{baseUrl}}/'.$url;

	if (is_array($save) && !empty($save)) {
		$sizes = array();
		foreach ($save as $k => $v) {
			$sizes[] = "$k";
		}
		sort($sizes);
		$stream->setAttribute('sizes', $sizes);
	}

	if (empty(Streams::$beingSavedQuery)) {
		$stream->changed($user->id);
	} else {
		$stream->save();
	}

	// if user invited send message User/icon/filled to invited stream to inform inviting user
	$invites = Streams_Invited::select('si.*', 'sid')
		->where(array(
			"sid.userId" => $user->id
		))
		->join(Streams_Invite::table() . ' si', array(
			"si.token" => "sid.token"
		), 'LEFT')->fetchDbRows();
	foreach ($invites as $invite) {
		Streams_Message::post($user->id, $invite->publisherId, $invite->streamName, array(
			'type' => 'User/icon/filled',
			'instructions' => array(
				"userId" => $user->id,
				"token" => $invite->token
			)
		), true);
	}
}