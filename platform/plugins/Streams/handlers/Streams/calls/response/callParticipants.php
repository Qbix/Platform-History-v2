<?php
function Streams_calls_response_callParticipants ($params) {
    $params = array_merge($_REQUEST, $params);
    $communityId = Users::currentCommunityId(true);
    $currentUser = Users::loggedInUser(true);
    $webrtcStreamPublisher = $params["webrtcStreamPublisher"];
    $webrtcStreamName = $params["webrtcStreamName"];
    $isHost = (bool)Users::roles($communityId, array("Users/hosts"), array(), $currentUser->id);

    $webrtc = Streams::fetchOne($webrtcStreamPublisher, $webrtcStreamPublisher, $webrtcStreamName);

    if (!$isHost || !$webrtc->testAdminLevel("invite")) {
        throw new Users_Exception_NotAuthorized();
    }

    // get participants
    $participants = $webrtc->getParticipants(array(
        "state" => "participating"
    ));

    return $participants;
}

