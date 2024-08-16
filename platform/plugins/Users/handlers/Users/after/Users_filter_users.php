<?php

function Users_after_Users_filter_users($params, &$result)
{
    $hiddenRole = 'Users/hidden';
    $communityId = Users::currentCommunityId(true);
    $roles = Users::roles($communityId);
    $config = Q_Config::get('Users', 'roles', array());
    foreach ($roles as $role) {
        if (Users_Label::canSeeLabel($role, $hiddenRole, $config)) {
            return;
        }
    }
    $userIds = $result;
    $settings = Users_Setting::select(array('userId', 'content'))->where(array(
        'userId' => $userIds,
        'name' => 'Users/hidden'
    ))->fetchAll(PDO::FETCH_ASSOC);
    $hiddenUserIds = array();
    foreach ($settings as $setting) {
        if (empty($setting['content'])) {
            return;
        }
        $content = Q::json_decode($setting['content'], true);
        if (in_array($communityId, $content)) {
            $hiddenUserIds[] = $setting['userId'];
        }
    }
    if ($hiddenUserIds) {
        $result = array_values(array_diff($userIds, $hiddenUserIds));
    }
}