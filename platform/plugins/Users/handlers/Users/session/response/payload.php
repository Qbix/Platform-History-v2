<?php

/**
 * Request the "payload" slot to generate a signed session payload.
 * Request the "redirect" slot to also get the full URL, including
 * parameters from the payload, you'll be redirecting to.
 * @param {array} $_REQUEST
 * @param {string} $_REQUEST.redirect the URL to redirect to,
 *  after adding querystring parameters to it from the payload.
 */
function Users_session_response_payload()
{
    Q_Request::requireFields(array('redirect', 'appId'), true);
    $req = Q::take($_REQUEST, array(
        'appId' => null, 
        'platform' => 'qbix'
    ));
    $redirect = $_REQUEST['redirect'];
    list($appId, $appInfo) = Users::appInfo($req['platform'], $req['appId'], true);
    $baseUrl = Q_Request::baseUrl();
    $scheme = Q::ifset($appInfo, 'scheme', null);
    $paths = Q::ifset($appInfo, 'paths', false);
    if (Q::startsWith($redirect, $baseUrl)) {
        $path = substr($redirect, strlen($baseUrl)+1);
        $path = $path ? $path : '/';
    } else if (Q::startsWith($redirect, $scheme)) {
        $path = substr($redirect, strlen($scheme));
        $path = $path ? $path : '/';
    } else {
        throw new Users_Exception_Redirect(array('uri' => $redirect));
    }
    if (is_array($paths) and !in_array($path, $paths)) {
        throw new Users_Exception_Redirect(array('uri' => $redirect));
    }
    $payload = Users_Session::generatePayload();
    $qs = http_build_query($payload);
    Q_Response::setSlot('redirect', Q_Uri::fixUrl("$redirect?$qs"));
    return $payload;
}