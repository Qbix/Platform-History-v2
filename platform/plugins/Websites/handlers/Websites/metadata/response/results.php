<?php

/**
 * @module Websites
 */

/**
 * Used to retrieve metadata set for various URLs
 *
 * @module Websites
 * @class HTTP Websites metadata
 * @method get
 * @param {array} $_REQUEST
 * @param {array} $_REQUEST.urls An array of string URLs for which metadata might be set
 * @return {array} Results consist of url => info
 */
function Websites_metadata_response_results()
{
    Q_Request::requireFields(array('urls'), true);

    $user = Users::loggedInUser(false, false);
	$userId = $user ? $user->id : "";

    $urls = array();
    $streamNames = array();
    foreach ($_REQUEST['urls'] as $url) {
        $sha1 = sha1($url);
        $streamNames[] = $streamName = "Websites/metadata/$sha1";
        $urls[$streamName] = $url;
    }

    $websitesUserId = Users::communityId();
    $streams = Streams::fetch($userId, $websitesUserId, $streamNames);

    $results = array();
    foreach ($urls as $url) {
        $results[$url] = null;
    }
    foreach ($streams as $stream) {
        if (!$stream) {
            continue;
        }
        $u = $urls[$stream->name];
        $results[$u] = $stream->getAllAttributes();
    }
    return $results;
}