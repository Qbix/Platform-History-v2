<?php

function Assets_after_Streams_updateStreamNames($params)
{
    $publisherId = Q::ifset($params, 'publisherId', null);
    $newPublisherId = Q::ifset($params, 'newPublisherId', null);
    $chunks = $params['chunks'];
    $errors = &$params['errors'];
    $accumulateErrors = $params['accumulateErrors'];
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
                    $criteria = array(
                        $streamNameField => array_keys($chunk)
                    );
                    if (isset($publisherId)) {
                        $criteria[$publisherIdField] = $publisherId;
                    }
                    try {
                        $values = Db_Expression::interpolateArray($chunk, array(
                            'publisherId' => $publisherIdField
                        ));
                        $changes = array($streamNameField => $values);
                        if (isset($newPublisherId)) {
                            $changes[$publisherIdField] = $newPublisherId;
                        }
                        call_user_func(array($ClassName, 'update'))
                            ->set($changes)
                            ->where($criteria)
                            ->execute();
                    }  catch (Exception $e) {
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