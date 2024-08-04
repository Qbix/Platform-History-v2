<?php

function Assets_after_Users_filter_users($params, &$result)
{
    $min = Q_Config::get('Assets', 'users', 'filter', 'credits', 'min', 0);
    if ($min == 0) {
        return;
    }
    // filter by users with at least $min credits
    list($communityIds, $personIds) = Users::splitIntoCommunityAndPersonIds($result);
    $credits = $av = sprintf("%015.2f", $min);
    $streamNames = array();
    foreach ($personIds as $pid) {
        $streamNames[] = "Assets/credits/$pid";
    }
    $filteredPersonIds = Streams_RelatedTo::select('streamName')->where(array(
        'toPublisherId' => Users::communityId(),
        'toStreamName' => 'Assets/category/credits',
        'type' => new Db_Range("attribute/amount=$credits", true, false, null)
    ))->where(compact('streamNames'))->fetchAll(PDO::FETCH_COLUMN, 0);
    $result = array_merge($communityIds, $filteredPersonIds);
}