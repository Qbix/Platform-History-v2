<?php

function Assets_after_Users_updateUserIds($params)
{
    $chunks = $params['chunks'];
    $userIdFields = array(
        'Assets' => array(
            'Badge' => array('appId', 'communityId'),
            'Charge' => array('userId'),
            'Connected' => array('merchantUserId'),
            'Credits' => array('fromUserId', 'toUserId', 'fromPublisherId', 'toPublisherId'),
            'Customer' => array('userId'),
            'Earned' => array('appId', 'communityId', 'userId'),
            'Leader' => array('communityId', 'userId'),
            'NftAttributes' => array('publisherId')
        )
    );
    foreach ($userIdFields as $Connection => $f1) {
        foreach ($f1 as $Table => $fields) {
            if (!is_array($fields)) {
                $fields = array($fields);
            }
            $ClassName = $Connection . '_' . $Table;
            foreach ($fields as $field) {
                foreach ($chunks as $chunk) {
                    call_user_func(array($ClassName, 'update'))
                        ->set(array($field => $chunk))
                        ->where(array(
                            $field => array_keys($chunk)
                        ))->execute();
                }
            }
        }
    }
}