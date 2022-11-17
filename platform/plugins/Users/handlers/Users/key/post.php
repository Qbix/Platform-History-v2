<?php

function Users_key_post()
{
    $sigField = Q_Config::get('Users', 'signatures', 'sigField', null);
    $fieldNames = array('info', array($sigField, 'publicKey'), array($sigField, 'signature'));
    Q_Request::requireFields($fieldNames, true);
    $publicKey = $_REQUEST[$sigField]['publicKey'];
    $info = $_REQUEST['info'];
    if ($info['name'] === 'ECDSA'
    and $info['namedCurve'] === 'P-384'
    and $info['hash'] === 'SHA-256') {
        Q_Session::start(); // start session if not already started
        if (!empty($_SESSION['Users']['publicKey'])) {
            throw new Q_Exception_AlreadyExists(array(
                'source' => 'session key'
            ));
        }
        $_SESSION['Users']['publicKey'] = $publicKey;
        // expect session to be saved at end of request
    }
    Q_Response::setSlot('saved', true);
}

