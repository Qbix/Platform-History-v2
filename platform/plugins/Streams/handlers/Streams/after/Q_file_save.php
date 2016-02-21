<?php

function Streams_after_Q_file_save($params)
{
	$user = Users::loggedInUser(true);
	$path = $subpath = $name = $writePath = $data = $tailUrl = null;
	extract($params, EXTR_OVERWRITE);
	if (!empty(Streams::$cache['canWriteToStream'])) {
		// some stream's associated file was being changed
		$stream = Streams::$cache['canWriteToStream'];
	}
	if (empty($stream)) {
		return;
	}
	$filesize = filesize($writePath.DS.$name);
	$url = $tailUrl;
	$url = Q_Valid::url($url) ? $url : Q_Request::baseUrl().'/'.$url;
	$prevUrl = $stream->getAttribute('file.url');
	$stream->setAttribute('file.url', $url);
	$stream->setAttribute('file.size', $filesize);
	// set the title and icon every time a new file is uploaded
	$stream->title = $name;
	$parts = explode('.', $name);
	$urlPrefix = Q_Request::baseUrl().'/plugins/Streams/img/icons/files';
	$dirname = STREAMS_PLUGIN_FILES_DIR.DS.'Streams'.DS.'icons'.DS.'files';
	$extension = end($parts);
	$stream->icon = file_exists($dirname.DS.$extension)
		? "$urlPrefix/$extension"
		: "$urlPrefix/_blank";
	if (empty(Streams::$beingSavedQuery)) {
		$stream->changed($user->id);
	} else {
		$stream->save();
	}
}