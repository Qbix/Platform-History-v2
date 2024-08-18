<?php

function Assets_after_Users_filter_users($params, &$result)
{
    if (!$result) {
        return;
    }
    $min = Q_Config::get('Assets', 'users', 'filter', 'peak', 'min', 0);
    if ($min == 0) {
        return;
    }
    $exceptRoles = Q_Config::get('Assets', 'users', 'filter', 'credits', 'exceptRoles', Q_Config::get(
        'Users', 'communities', 'admins', array('Users/owners', 'Users/admins')
    ));
    if (Users::roles(Users::currentCommunityId(true), $exceptRoles)
     && Users::roles(Users::communityId(), $exceptRoles)) {
        return;
    }
    // filter by users with at least $min credits
    list($communityIds, $personIds) = Users::splitIntoCommunityAndPersonIds($result);
    $credits = $av = sprintf("%015.2f", $min);
    $streamNames = array();
    foreach ($personIds as $pid) {
        $streamNames[] = "Assets/credits/$pid";
    }
    $sns = Streams_RelatedTo::select('fromStreamName')->where(array(
        'toPublisherId' => Users::communityId(),
        'toStreamName' => 'Assets/category/credits',
        'type' => new Db_Range("attribute/peak=$credits", true, false, null)
    ))->where(array(
        'fromStreamName' => $streamNames
    ))->orderBy('type', false)
    ->fetchAll(PDO::FETCH_COLUMN, 0);
    $filteredStreamNames = array_flip($sns);
    $filteredPersonIds = array();
    foreach ($personIds as $pid) {
        if (!empty($filteredStreamNames["Assets/credits/$pid"])) {
            $filteredPersonIds[] = $pid;
        }
    }
    $result = array_merge($communityIds, $filteredPersonIds);
}