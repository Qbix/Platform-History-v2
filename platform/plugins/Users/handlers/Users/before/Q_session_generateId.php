<?php

function Users_before_Q_session_generateId($params, &$result)
{
    $payload = $_REQUEST;
    if (isset($params['payload'])
    and $publicKey = Users::verify($params['payload'], false)) {
        // valid payload and public key provided
        $result = $publicKey;
    }
}