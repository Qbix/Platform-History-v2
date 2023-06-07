<?php

function Streams_after_Users_updateUserIds($params)
{
    $chunks = $params['chunks'];
    $accumulateErrors = $params['accumulateErrors'];
    $errors = &$params['errors'];
    $userIdFields = array(
        'Streams' => array(
            'Stream' => 'publisherId',
            'Category' => 'publisherId',
            'Message' => 'publisherId',
            'MessageTotal' => 'publisherId',
            'RelatedTo' => array('toPublisherId', 'fromPublisherId'),
            'RelatedToTotal' => array('toPublisherId'),
            'RelatedFrom' => array('toPublisherId', 'fromPublisherId'),
            'RelatedFromTotal' => array('fromPublisherId'),
            'Invited' => array('userId'),
            'Participant' => 'publisherId',
            'Subscription' => 'publisherId',
            'SubscriptionRule' => 'publisherId',
            'Notification' => 'publisherId',
            'Request' => 'publisherId',
            'Invite' => 'publisherId',
            'Task' => 'streamName'
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
                    try {
                        call_user_func(array($ClassName, 'update'))
                            ->set(array($field => $chunk))
                            ->where(array(
                                $field => array_keys($chunk)
                            ))->execute();
                    } catch (Exception $e) {
                        if ($accumulateErrors) {
                            $errors[] = $e;
                        } else {
                            throw $e;
                        }
                    }
                }
            }
        }
    }
}