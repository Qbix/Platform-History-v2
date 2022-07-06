<?php
function Streams_calls_response_approveCall ($params) {
    $params = array_merge($_REQUEST, $params);
    $communityId = Users::currentCommunityId(true);
    $currentUser = Users::loggedInUser(true);
    $webrtcStreamPublisher = $params["webrtcStreamPublisher"];
    $webrtcStreamName = $params["webrtcStreamName"];
    $action = $params["action"];
    $isHost = (bool)Users::roles($communityId, array("Users/hosts"), array(), $currentUser->id);

    $webrtc = Streams_Stream::fetch($webrtcStreamPublisher, $webrtcStreamPublisher, $webrtcStreamName);

    if (!$isHost || !$webrtc->testAdminLevel("invite")) {
        throw new Users_Exception_NotAuthorized();
    }

    if ($action == 'approve') {
        $webrtc->setAttribute('approved', 'true');
    } else {
        $webrtc->setAttribute('approved', 'false');
    }
    /*$webrtc->post($currentUser->id, array(
        'type' => 'Streams/changed'
    ), true);*/
    $webrtc->changed();
    $webrtc->save();

    return $action;
}

