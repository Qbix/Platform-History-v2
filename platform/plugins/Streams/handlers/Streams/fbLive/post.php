<?php

/**
 * @module Streams
 */

/**
 * Is used to create facebook live streaming
 * @class HTTP Streams fbLive
 * @method post
 * @param {array} [$_REQUEST] Parameters that is needed to create live
 *   @param {string} $_REQUEST.title
 *   @param {string} $_REQUEST.description
 *   @param {string} $_REQUEST.privacy SELF/ALL_FRIENDS/EVERYONE
 * @return {void}
 */
function Streams_fbLive_post($params = array())
{
	$params = array_merge($_REQUEST, $params);

	if(!isset($params['action'])) {
		throw new \Exception('Please specify action');
	} else {
		if($params['action'] == 'start') {
			Streams_fbLive_startStreaming($params);
		} else if($params['action'] == 'end') {
			Streams_fbLive_endStreaming($params);
		}
	}
}

function Streams_fbLive_startStreaming($params) {
	$apps = Q_Config::get('Users', 'apps', 'facebook', array());

	$communityId = Users::communityId();


	foreach ($apps as $k => $v) {
		if ($k === $communityId) {
			$fbAppid = $v['appId'];
			$fbSecret = $v['secret'];
			break;
		}
	}

	$fbParams = array_merge(array(
		'app_id' => $fbAppid,
		'app_secret' => $fbSecret,
		'default_graph_version' => 'v2.12'
	));

	$fb = new Facebook\Facebook($fbParams);
// app directory could be anything but website URL must match the URL given in the developers.facebook.com/apps
	$accessToken = $params['accessToken'];

	// getting short-lived access token
	$_SESSION['fb_token'] = (string) $accessToken;
	// OAuth 2.0 client handler
	$oAuth2Client = $fb->getOAuth2Client();
	// Exchanges a short-lived access token for a long-lived one
	$longLivedAccessToken = $oAuth2Client->getLongLivedAccessToken($_SESSION['fb_token']);
	$_SESSION['fb_token'] = (string) $longLivedAccessToken;
	// setting default access token to be used in script
	$fb->setDefaultAccessToken($_SESSION['fb_token']);
	// validating user access token
	try {
		$user = $fb->get('/me');
		$user = $user->getGraphNode()->asArray();
	} catch(Facebook\Exceptions\FacebookResponseException $e) {
		// When Graph returns an error
		echo 'Graph returned an error: ' . $e->getMessage();
		session_destroy();
		// if access token is invalid or expired you can simply redirect to login page using header() function
		exit;
	} catch(Facebook\Exceptions\FacebookSDKException $e) {
		// When validation fails or other local issues
		echo 'Facebook SDK returned an error: ' . $e->getMessage();
		exit;
	}
	// to create live video

	$title = (isset($params['title']) && !empty($params['title'])) ? $params['title'] : date("D M d, Y G:i");
	$description = (isset($params['description']) && !empty($params['description'])) ? $params['description'] : '';
	$link = ($_SERVER['HTTPS'] ? 'https' : 'http') . "://" . $_SERVER['SERVER_NAME'];
	$description .= "\r\n" . $link;
	$privacy = (isset($params['privacy']) && !empty($params['privacy'])) ? $params['privacy'] : 'SELF';

	$privacyDesc = ['SELF' => 'Only Me', 'ALL_FRIENDS' => 'Only Friends', 'EVERYONE' => 'Everyone'];

	if(!is_numeric($privacy)) {
        $createLiveVideo = $fb->post('/me/live_videos', ['title' => $title, 'description' => $description, 'status' => 'LIVE_NOW', 'privacy' => ['value' => $privacy]]);
    } else {
        $createLiveVideo = $fb->post('/' . $privacy . '/live_videos', ['title' => $title, 'description' => $description, 'status' => 'LIVE_NOW'/*, 'privacy' => ['value' => $privacy]*/]);

    }
	$createLiveVideo = $createLiveVideo->getGraphNode()->asArray();

    $liveInfo =  $fb->get($createLiveVideo['id'] . '?fields=permalink_url,id,embed_html,status', $accessToken);
	$createLiveVideo = array_merge($createLiveVideo, $liveInfo->getGraphNode()->asArray());

	Q_Response::setSlot('fbLive', $createLiveVideo);
}

function Streams_fbLive_endStreaming($params) {

	$apps = Q_Config::get('Users', 'apps', 'facebook', array());

	$communityId = Users::communityId();


	foreach ($apps as $k => $v) {
		if ($k === $communityId) {
			$fbAppid = $v['appId'];
			$fbSecret = $v['secret'];
			break;
		}
	}

	$fbParams = array_merge(array(
		'app_id' => $fbAppid,
		'app_secret' => $fbSecret,
		'default_graph_version' => 'v2.12'
	));

	$fb = new Facebook\Facebook($fbParams);
// app directory could be anything but website URL must match the URL given in the developers.facebook.com/apps
	$accessToken = $params['accessToken'];

	// getting short-lived access token
	$_SESSION['fb_token'] = (string) $accessToken;
	// OAuth 2.0 client handler
	$oAuth2Client = $fb->getOAuth2Client();
	// Exchanges a short-lived access token for a long-lived one
	$longLivedAccessToken = $oAuth2Client->getLongLivedAccessToken($_SESSION['fb_token']);
	$_SESSION['fb_token'] = (string) $longLivedAccessToken;
	// setting default access token to be used in script
	$fb->setDefaultAccessToken($_SESSION['fb_token']);
	// validating user access token
	try {
		$user = $fb->get('/me');
		$user = $user->getGraphNode()->asArray();
	} catch(Facebook\Exceptions\FacebookResponseException $e) {
		// When Graph returns an error
		echo 'Graph returned an error: ' . $e->getMessage();
		session_destroy();
		// if access token is invalid or expired you can simply redirect to login page using header() function
		exit;
	} catch(Facebook\Exceptions\FacebookSDKException $e) {
		// When validation fails or other local issues
		echo 'Facebook SDK returned an error: ' . $e->getMessage();
		exit;
	}
	// to create live video

	if(!isset($params['id'])) {
		throw new \Exception('Please specify live id');
	} else {
		$liveId = $params['id'];
	}

	$endLiveVideo = $fb->post($liveId, ['end_live_video' => true]);
	$endLiveVideo = $endLiveVideo->getGraphNode()->asArray();


	Q_Response::setSlot('fbLive', $endLiveVideo);

}