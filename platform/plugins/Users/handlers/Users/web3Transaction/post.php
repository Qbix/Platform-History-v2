<?php

function Users_web3Transaction_post()
{
    $user = Users::loggedInUser(true);
    $quotaName = 'Users_Web3Transaction';
    Users_Quota::check($user->id, $user->id, $quotaName, true);
    $t = Users_Web3Transaction::createFromInput();
    $t->save();
    $q = new Users_Quota(array(
        'userId' => $user->id,
        'resourceId' => $user->id,
        'name' => $quotaName
    ));
    $q->used(1);
}