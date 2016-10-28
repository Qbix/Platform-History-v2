<?php

function Streams_after_Q_file_save($params)
{
	$path = $subpath = $name = $writePath = $data = $tailUrl = $size = null;
	extract($params, EXTR_OVERWRITE);
	if (!empty(Streams::$cache['canWriteToStream'])) {
		// some stream's associated file was being changed
		$stream = Streams::$cache['canWriteToStream'];
	}
	if (empty($stream)) {
		return;
	}
	$url = Q_Valid::url($tailUrl) ? $tailUrl : '{{baseUrl}}/'.$tailUrl;
	$stream->setAttribute('Q.file.url', $url);
	$stream->setAttribute('Q.file.size', $size);
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
		$stream->changed();
	} else {
		$stream->save();
	}
}