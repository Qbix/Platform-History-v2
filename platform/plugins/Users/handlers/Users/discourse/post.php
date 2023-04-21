<?php

function Users_discourse_post($params)
{
    if (!Users::roles(null, array('Users/owners', 'Users/admins'))) {
        throw new Users_Exception_NotAuthorized();
    }
    $r = array_merge($_REQUEST, $params);
    Q_Valid::requireFields(array('apiKey', 'userId', 'baseUrl'), $r, true);
    $userId = $r['userId'];
    $baseUrl = $r['baseUrl'];
    $apiKey = $r['apiKey'];
    $uxt = new Users_ExternalTo_Discourse(array(
        'userId' => $userId,
        'platform' => 'discourse',
        'appId' => $baseUrl
    ));
    $uxt->setExtra(compact('baseUrl', 'apiKey'));
    $ret = $uxt->create();

    // Q_Request::requireFields(array(
    //     array('user', 'name'),
    //     array('user', 'email'),
    //     array('user', 'password'),
    //     array('user', 'userId')
    // ), true);
    // $user = $_REQUEST['user'];
    // Users_ExternalTo_Discourse::createForumUser(
    //     $user['name'], 
    //     $user['email'],
    //     $user['password'],
    //     $user['userId']
    // );
    Q_Response::setSlot('data', array());
}