<?php

function Assets_after_Streams_updateStreamNames($params)
{
    $publisherId = $params['publisherId'];
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
                    $criteria = isset($publisherId)
						? array(
							$publisherIdField => $publisherId,
							$streamNameField => array_keys($chunk)
						) : array($streamNameField => array_keys($chunk));
                    try {
                        call_user_func(array($ClassName, 'update'))
                            ->set(array($streamNameField => $chunk))
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