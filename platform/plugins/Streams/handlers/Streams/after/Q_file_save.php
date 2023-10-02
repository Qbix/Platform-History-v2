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
		$bitrate = Q::ifset($meta, 'audio', 'bitrate', 128000);
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
		$stream->changed();

		$environment = Q_Config::get("Q", "environment", null);
		$environments = Q_Config::get("Q", "video", "cloud", "environments", array('live'));
		if (!in_array($environment, $environments)) {
			return; // wrong environment, webhooks may not work etc.
		}

		// Try to upload to cloud provider, if defined in config
		$uploadedToProvider = false;
		$cloudUpload = Q_Config::get("Q", "video", "cloud", "upload", array());
		$provider = Q::ifset($_REQUEST, 'provider', array_key_first($cloudUpload));
		if ($cloudUpload and $provider) {
			$className = "Q_Video_".ucfirst($provider);
			try {
				$adapter = new $className($filePath);
				$result = $adapter->upload($filePath);
			} catch (Exception $e) {
				$result = null;
			}

			if (Q::isAssociative($result)) {
				$stream->setAttribute("Streams/cloud/provider", $provider);
				$stream->setAttribute("Streams/cloud/videoId", $result["videoId"]);
				$stream->setAttribute("Streams/cloud/videoUrl", $result["videoUrl"]);
				$stream->clearAttribute("Q.file.url");
				$stream->changed();
				$uploadedToProvider = true;
			}
		}

		// May use converter to process video and set stream icon to animated GIF
		$cloudConvert = Q_Config::get("Q", "video", "cloud", "convert", array());
		$converter = Q::ifset($_REQUEST, 'converter', array_key_first($cloudConvert));
		if ($cloudConvert and $converter) {
			$options['tag'] = json_encode(array(
				"publisherId" => $stream->publisherId,
				"streamName" => $stream->name
			));
			$className = "Q_Video_".ucfirst($converter);
			try {
				$adapter = new $className($filePath);
				$adapter->convert($filePath, $options);
			} catch (Exception $e) {
				// stream icon will silently remain as-is
			}
		}

		// remove local uploaded file if uploaded to video provider
		if ($uploadedToProvider) {
			@unlink($filePath);
		}
	}
}