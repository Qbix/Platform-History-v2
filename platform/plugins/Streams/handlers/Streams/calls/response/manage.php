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

    $webrtc = Streams::fetchOne($webrtcStreamPublisher, $webrtcStreamPublisher, $webrtcStreamName);
    $eventsStream = Streams::fetchOne($eventsStreamPublisher, $eventsStreamPublisher, $eventsStreamName);

    if (!$isHost || !$webrtc->testAdminLevel("invite")) {
        throw new Users_Exception_NotAuthorized();
    }

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
    } else if ($action == "leave") {
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
    } else if ($action == "approve") {
        $participant = $webrtc->leave(compact("userId"));
        $webrtc->setAttribute('startTime', $startTime);
        $webrtcStream->clearAttribute('endTime');
        $webrtcStream->save();
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

