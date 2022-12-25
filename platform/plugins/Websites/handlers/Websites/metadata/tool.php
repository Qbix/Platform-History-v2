<?php

/**
 * Websites Tools
 * @module Websites-tools
 * @main Websites-tools
 */
	
/**
 * Tool for admins to edit the url, title, keywords, description of the current page
 * @class Websites metadata
 * @constructor
 * @param {Object} [$options] Options for the tool
 * @param {String} [$options.skipIfNotAuthorized=true] Whether to skip rendering the contents of the tool if the logged-in user is not authorized to edit the metadata for this page.
 */
function Websites_metadata_tool($options)
{
	$skipIfNotAuthorized = Q::ifset($options, 'skipIfNotAuthorized', true);
	if ($skipIfNotAuthorized) {
		$websitesUserId = Users::communityId();
		$sha1 = sha1(Q_Dispatcher::uri());
		$metadataStreamName = "Websites/metadata/$sha1";
		$stream = Streams_Stream::fetch(null, $websitesUserId, $metadataStreamName);
		$user = Users::loggedInUser();
		if (!$user or ($stream and !$stream->testWriteLevel('suggest'))) {
			$options['skip'] = true;
		}
		if (!$stream
		and !Streams::canCreateStreamType(Q::ifset($user, "id", null), $websitesUserId, 'Websites/metadata')) {
			$options['skip'] = true;
		}
	}
	unset($options['skipIfNotAuthorized']);
	
	Q_Response::addStylesheet('{{Websites}}/css/Websites.css', 'Websites');
	Q_Response::addScript("{{Websites}}/js/Websites.js", 'Websites');
	Q_Response::setToolOptions($options);
	
	$user = Users::loggedInUser(false, false);
	$userId = $user ? $user->id : "";
	$communityId = Users::communityId();
	$sha1 = sha1(Q_Dispatcher::uri());
	$metadataStreamName = "Websites/metadata/$sha1";
	$streams = Streams::fetch($userId, $communityId, array(
		"Websites/header", "Websites/title", "Websites/slogan", $metadataStreamName
	));
	foreach ($streams as $name => $s) {
		if ($s) {
			$s->addPreloaded($userId);
		}
	}
}