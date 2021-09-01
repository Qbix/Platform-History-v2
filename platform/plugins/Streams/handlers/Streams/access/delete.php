<?php

/**
 * Cancel access to stream
 * @method delete
 * @param {array} $_REQUEST
 * @param {string} [$_REQUEST.publisherId] optional. publisher id of access record.
 * @param {string} [$_REQUEST.streamName] Stream name to which access was granted.
 * @param {string} [$_REQUEST.ofUserId] Optional in pair when streamName and ofContactLabel is required. Id of user to which access was granted.
 * @param {string} [$_REQUEST.ofContactLabel] Optional in pair when streamName and ofUserId is required. Contact label o which access was granted.
 */
function Streams_access_delete($params) {
    $r = array_merge($_REQUEST, $params);
    $required = array('streamName');
    Q_Valid::requireFields($required, $r, true);
    $publisherId = $r['publisherId'];
    $streamName = $r['streamName'];
    $ofUserId = $r['ofUserId'];
    $ofContactLabel = $r['ofContactLabel'];

    if (empty($streamName) or (empty($ofUserId) and empty($ofContactLabel)) ) {
        throw new Q_Exception_RequiredField(array('field' => 'streamName and ofUserId or streamName and ofContactLabel'));
    }


    $userId = Q::ifset($r, 'userId', Users::loggedInUser(true)->id);

    $labelRows = Users_Label::fetch($userId, 'Users/');

    $isAdmin = false;
    foreach ($labelRows as $label) {
        if ($label == 'Users/admins') {
            $isAdmin = true;
            break;
        }
    }

    if(!$isAdmin && $publisherId != $userId) {
        throw new Users_Exception_NotAuthorized();
    }

    $access = new Streams_Access();
    $access->publisherId = Q::ifset($_REQUEST, 'publisherId', '');
    $access->streamName = Q::ifset($_REQUEST, 'streamName', '');
    $access->ofUserId = Q::ifset($_REQUEST, 'ofUserId', '');
    $access->ofContactLabel = Q::ifset($_REQUEST, 'ofContactLabel', '');
    if($access->retrieve()) {
        $access->remove();
    }
}