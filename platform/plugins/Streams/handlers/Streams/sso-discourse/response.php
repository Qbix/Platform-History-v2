<?php

function Streams_sso_discourse_response()
{
    $app = Q::app();
    list($appId, $appInfo) = Users::appInfo('discourse', $app);
    $secret = Q::ifset($appInfo, 'provider', 'secret', null);
    if (!$secret) {
        throw new Q_Exception_MissingConfig(array(
            'fieldpath' => "Users/apps/discourse/$app/provider/secret"
        ));
    }
    Q_Request::requireFields(array('sso', 'sig'), true);
    $sig = $_REQUEST['sig'];
    $sso = $_REQUEST['sso'];
    if ($sig !== hash_hmac('sha256', $sso, $secret)) {
        throw new Q_Exception_WrongValue(array(
            'field' => 'sig',
            'range' => 'valid signature',
            'value' => $sig
        ));
    }
    $decoded = base64_decode($sso);
    $fields = array();
    foreach (explode('&', $decoded) as $segment) {
        $parts = explode('=', $segment);
        $fields[urldecode($parts[0])] = urldecode($parts[1]);
    }
    Q::var_dump($fields);exit;
    return true;
}