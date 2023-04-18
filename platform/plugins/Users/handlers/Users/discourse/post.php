<?php

function Users_discourse_post()
{
    if (!Users::roles(null, array('Users/owners', 'Users/admins'))) {
        throw new Users_Exception_NotAuthorized();
    }
    $uxt = new Users_ExternalTo_Discourse(array(
        'userId' => Users::loggedInUser(true)->id,
        'platform' => 'discourse',
        'appId' => 'ITR'
    ));
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