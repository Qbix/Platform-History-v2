<?php

function Users_after_Users_createDiscourseUser($params)
{
    $email = $params['email']->address;
    $name = $params['user']->displayName();
    $userId = $params['user']->fields['id'];
    $password = Q::ifset($_REQUEST, 'passphrase', null);

    if (empty($password) || empty($name) || empty($email)) {
        return;
    }

    Users_ExternalTo_Discourse::createForumUser($name, $email, $password, $userId);
}