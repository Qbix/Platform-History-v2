<?php

function Assets_after_Streams_updateStreamNames($params)
{
    $publisherId = $params['publisherId'];
    $chunks = $params['chunks'];
    $userIdFields = array(
        'Assets' => array(
            'Charge' => array(
                'publisherId' => 'streamName'
            ),
            'Credits' => array(
                'fromPublisherId' => 'fromStreamName',
                'toPublisherId' => 'toStreamName'
            ),
            'Earned' => array(
                'publisherId' => 'streamName'
            )
        )
    );
    foreach ($userIdFields as $Connection => $f1) {
        foreach ($f1 as $Table => $f2) {
            $ClassName = $Connection . '_' . $Table;
            foreach ($f2 as $publisherIdField => $streamNameField) {
                foreach ($chunks as $chunk) {
                    call_user_func(array($ClassName, 'update'))
                        ->set(array($streamNameField => $chunk))
                        ->where(array(
                            $publisherIdField => $publisherId,
                            $streamNameField => array_keys($chunk)
                        ))->execute();
                }
            }
        }
    }
}