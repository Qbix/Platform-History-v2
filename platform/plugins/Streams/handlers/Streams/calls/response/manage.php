<?php
function Streams_calls_response_manage ($params) {
	$params = array_merge($_REQUEST, $params);
	$communityId = Users::currentCommunityId(true);
	$currentUser = Users::loggedInUser(true);
	$userId = $params["userId"];
	$action = $params["action"];
	$webrtcStreamPublisher = $params["webrtcStreamPublisher"];
	$webrtcStreamName = $params["webrtcStreamName"];
	$eventsStreamPublisher = $params["eventsStreamPublisher"];
	$eventsStreamName = $params["eventsStreamName"];
	$isHost = (bool)Users::roles($communityId, array("Users/hosts"), array(), $currentUser->id);

	//$webrtc = Media::getCurrentLiveShowWebrtc();
	$webrtc = Streams::fetchOne($webrtcStreamPublisher, $webrtcStreamPublisher, $webrtcStreamName);
	$eventsStream = Streams::fetchOne($eventsStreamPublisher, $eventsStreamPublisher, $eventsStreamName);

	if (!$isHost || !$webrtc->testAdminLevel("invite")) {
		throw new Users_Exception_NotAuthorized();
	}

	// we use Media/live stream to send messages because all visitors joined to this stream automaticaly
	//$mediaLive = Media::getCurrentLiveShow();

	if ($action == "join") {
		$participant = $webrtc->join(compact("userId"));
		if ($participant->state == "participating") {
            $eventsStream->post(Users::communityId(), array(
				"type" => "Media/webrtc/guest",
				"instructions" => array(
					"joined" => true,
					"userId" => $userId,
                    "webrtcStream" => [
                        "publisherId" => $webrtcStreamPublisher,
                        "name" => $webrtcStreamName,
                    ]
				)
			), true);
		}
	} elseif ($action == "leave") {
		$participant = $webrtc->leave(compact("userId"));
		if ($participant->state == "left") {
            $eventsStream->post(Users::communityId(), array(
				"type" => "Media/webrtc/guest",
				"instructions" => array(
					"joined" => false,
					"userId" => $userId
				)
			), true);
		}
	}
}

