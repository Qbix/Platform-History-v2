<?php

function Streams_after_Q_file_save($params)
{
	$path = $subpath = $name = $writePath = $data = $tailUrl = $size = $audio = null;
	extract($params, EXTR_OVERWRITE);
	if (!empty(Streams::$cache['canWriteToStream'])) {
		// some stream's associated file was being changed
		$stream = Streams::$cache['canWriteToStream'];
	}
	if (empty($stream)) {
		return;
	}

	$filePath = $writePath.$name;
	$mimeType = finfo_file(finfo_open(FILEINFO_MIME_TYPE), $filePath);

	$url = Q_Valid::url($tailUrl) ? $tailUrl : '{{baseUrl}}/'.$tailUrl;
	$url = str_replace('\\', '/', $url);
	$stream->setAttribute('Q.file.url', $url);
	$stream->setAttribute('Q.file.size', $size);
	if ($audio) {
		include_once(Q_CLASSES_DIR.DS.'Audio'.DS.'getid3'.DS.'getid3.php');
		$getID3 = new getID3;
		$meta = $getID3->analyze($filePath);
		$bitrate = $meta['audio']['bitrate'];
		$bits = $size * 8;
		$duration = $bits / $bitrate;
		$stream->setAttribute('Q.audio.bitrate', $bitrate);
		$stream->setAttribute('Q.audio.duration', $duration);
	}
	if (Streams_Stream::getConfigField($stream->type, 'updateTitle', false)) {
		// set the title every time a new file is uploaded
		$stream->title = $name;
	}
	if (Streams_Stream::getConfigField($stream->type, 'updateIcon', false)) {
		// set the icon every time a new file is uploaded
		$parts = explode('.', $name);
		$urlPrefix = '{{baseUrl}}/{{Streams}}/img/icons/files';
		$dirname = STREAMS_PLUGIN_FILES_DIR.DS.'Streams'.DS.'icons'.DS.'files';
		$extension = end($parts);
		$stream->icon = file_exists($dirname.DS.$extension)
			? "$urlPrefix/$extension"
			: "$urlPrefix/_blank";
	}
	if (empty(Streams::$beingSavedQuery)) {
		$stream->changed();
	} else {
		$stream->save();
	}

	// video files handler
	if (preg_match("/^video/", $mimeType)) {
		// copy Q.file.save attribute to videoUrl attribute to know that video
		$stream->setAttribute("videoUrl", $url);
		$stream->save();

		// try to use video provider, if defined in config
		$cloudUpload = Q_Config::get("Q", "video", "cloudUpload", null);
		$uploadedToProvider = false;
		if (!empty($cloudUpload)) {
			$cloudUploadName = array_key_first($cloudUpload);
			$className = "Q_Video_".ucfirst($cloudUploadName);
			try {
				$result = $className::upload($filePath);
			} catch (Exception $e) {
				$result = null;
			}

			if (Q::isAssociative($result)) {
				$stream->setAttribute("uploadProvider", $cloudUpload);
				$stream->setAttribute("videoId", $result["videoId"]);
				$stream->setAttribute("videoUrl", $result["videoUrl"]);
				$stream->clearAttribute("Q.file.url");
				$stream->save();
				$uploadedToProvider = true;
			}
		}

		// convert to animated gif
		if (Q_Config::get("Q", "environment", null) != "local") { // if send request from local env, the webhook failed and lead to disable on CoudConvert profile.
			$options = Q_Config::get("Q", "video", "cloudConvert", "options", null);
			if ($options) {
				$tag = json_encode(array(
					"publisherId" => $stream->publisherId,
					"streamName" => $stream->name
				));

				try {
					Q_Video_CloudConvert::convert($filePath, $tag, "gif", $options);
				} catch (Exception $e) {

				}
			}
		}

		// remove local uploaded file if uploaded to video provider
		if ($uploadedToProvider) {
			@unlink($filePath);
		}
	}
}