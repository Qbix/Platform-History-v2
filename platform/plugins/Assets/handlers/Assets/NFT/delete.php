<?php
function Assets_NFT_delete ($params) {
	$request = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(["publisherId", "streamName"], $request, true);
	$loggedInUserId = Users::loggedInUser(true)->id;
	$publisherId = Q::ifset($request, "publisherId", null);
	$streamName = Q::ifset($request, "streamName", null);
	$adminLabels = Q_Config::get("Users", "communities", "admins", null);
	// if user try to update align profile or is not an admin
	if ($publisherId != $loggedInUserId && !(bool)Users::roles(null, $adminLabels, array(), $loggedInUserId)) {
		throw new Users_Exception_NotAuthorized();
	}

	$stream = Streams::fetchOne(null, $publisherId, $streamName, true);
	$directoryToClear = null;
	$slotName = null;

	if (Q_Request::slotName("image")) {
		$directoryToClear = $stream->iconDirectory();
		$slotName = "image";
		$stream->icon = Q_Config::get("Streams", "types", "Assets/NFT", "defaults", "icon", null);
		$stream->changed();
	} elseif (Q_Request::slotName("video")) {
		$directoryToClear = $stream->uploadsDirectory().DS."video";
		$slotName = "video";
		$stream->clearAttribute("Q.file.url");
		$stream->clearAttribute("Q.file.size");
		$stream->clearAttribute("videoUrl");
		$stream->clearAttribute("videoId");
		$stream->clearAttribute("uploadProvider");
		$stream->changed();
	} elseif (Q_Request::slotName("audio")) {
		$directoryToClear = $stream->uploadsDirectory().DS."audio";
		$slotName = "audio";
		$stream->clearAttribute("Q.file.url");
		$stream->clearAttribute("Q.file.size");
		$stream->clearAttribute("audioUrl");
		$stream->changed();
	} else {
		throw new Exception("invalid slot name");
	}

	if (!$directoryToClear) {
		throw new Exception("not found directory to clean");
	}

	Q_Utils::canWriteToPath($directoryToClear, true, false);

	foreach(new RecursiveIteratorIterator(
				new RecursiveDirectoryIterator($directoryToClear, FilesystemIterator::SKIP_DOTS | FilesystemIterator::UNIX_PATHS),
				RecursiveIteratorIterator::CHILD_FIRST) as $value) {
		$value->isFile() ? unlink($value) : rmdir($value);
	}

	Q_Response::setSlot($slotName, true);
}