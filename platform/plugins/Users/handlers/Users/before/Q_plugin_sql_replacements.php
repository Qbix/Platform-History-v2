<?php


function Users_before_Q_plugin_sql_replacements($params, &$result)
{
    $communityId = Users::communityId();
    $result['communityId'] = json_encode($communityId);
}