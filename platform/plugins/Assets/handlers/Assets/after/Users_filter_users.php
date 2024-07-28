<?php

function Assets_after_Users_filter_users($params, &$result)
{
    $min = Q_Config::get('Assets', 'users', 'filter', 'credits', 'min', 0);
    if ($min == 0) {
        return;
    }
    // filter by users with at least $min credits
    $credits = $av = sprintf("%015.2f", $min);
    $result = Streams_RelatedTo::select('DISTINCT fromPublisherId')->where(array(
        'toPublisherId' => 'Assets',
        'toStreamName' => 'Assets/category/credits',
        'type' => new Db_Range("attribute/amount=$credits", true, false, null)
    ))->fetchAll(PDO::FETCH_COLUMN, 0);
}