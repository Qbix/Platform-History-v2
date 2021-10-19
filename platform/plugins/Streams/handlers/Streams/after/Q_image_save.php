<?php

function Streams_after_Q_image_save($params)
{
	$user = Q::ifset(Users::$cache, 'user', Users::loggedInUser(false, false));
	if (!$user) {
		return;
	}
	$path = $subpath = null;
	$data = $save = array();
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
	$stream->icon = Q_Valid::url($url) ? $url : '{{baseUrl}}/'.$url;

	if (is_array($save) && !empty($save)) {
		$sizes = array();
		foreach ($save as $k => $v) {
			$sizes[] = "$k";
		}
		sort($sizes);
		$stream->setAttribute('sizes', $sizes);
	}

	// save full size image as file
	if ($_REQUEST["original"]) {
		$imgData = base64_decode(chunk_split(substr($_REQUEST["original"], strpos($_REQUEST["original"], ',')+1)));
		if (Q_image::isJPEG($imgData)) {
			$ext = "jpg";
		} elseif (Q_image::isPNG($imgData)) {
			$ext = "png";
		} else {
			$ext = "gif";
		}
		$file = array(
			'data' => $_REQUEST["original"],
			'name' => "original.$ext",
			'path' => $path,
			'subpath' => Q_Utils::splitId($stream->publisherId).DS."{$stream->name}".DS."file".DS.time()
		);
		Q::event("Q/file/post", $file);
	}

	if (empty(Streams::$beingSavedQuery)) {
		$stream->changed($user->id);
	} else {
		$stream->save();
	}
}