<?php

function Streams_after_Q_image_save($params)
{
	$user = Users::loggedInUser(true);
	$path = $subpath = $data = $save = null;
	extract($params, EXTR_OVERWRITE);
	if (isset(Users::$cache['iconUrlWasChanged'])
	and (Users::$cache['iconUrlWasChanged'] === false)) {
		// the logged-in user's icon was changed without the url changing
		$stream = Streams::fetchOne($user->id, $user->id, "Streams/user/icon");
	} else if (!empty(Streams::$cache['canWriteToStream'])) {
		// some stream's icon was being changed
		$stream = Streams::$cache['canWriteToStream'];
	}
	if (empty($stream)) {
		return;
	}
	$url = $data[''];
	$stream->icon = Q_Valid::url($url) ? $url : Q_Request::baseUrl().'/'.$url;
	$sizes = array();
	foreach ($save as $k => $v) {
		$sizes[] = "$k";
	}
	sort($sizes);
	$stream->setAttribute('sizes', $sizes);
	if (empty(Streams::$beingSavedQuery)) {
		$stream->changed($user->id);
	} else {
		$stream->save();
	}
}