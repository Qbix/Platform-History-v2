<?php

function Streams_fblive_response_fblive($params = array()) {
    $params = array_merge($_REQUEST, $params);

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
		$createLiveVideo = $fb->post('/me/live_videos', ['title' => 'new video', 'description' => 'descrip of the video']);
		$createLiveVideo = $createLiveVideo->getGraphNode()->asArray();
		//print_r('1');
		//print_r($createLiveVideo);
		/*// to get live video info
		$LiveVideo = $fb->get('/live_video_id');
		$LiveVideo = $LiveVideo->getGraphNode()->asArray();
		print_r($LiveVideo);
		// to update live video
		$LiveVideo = $fb->post('/live_video_id', ['title' => 'title of the new video']);
		$LiveVideo = $LiveVideo->getGraphNode()->asArray();
		print_r($LiveVideo);
		// to delete live video
		$LiveVideo = $fb->delete('/live_video_id');
		$LiveVideo = $LiveVideo->getGraphNode()->asArray();
		print_r($LiveVideo);*/
		// Now you can redirect to another page and use the access token from $_SESSION['fb_token']


    Q_Response::setSlot('fblive', $createLiveVideo);

}