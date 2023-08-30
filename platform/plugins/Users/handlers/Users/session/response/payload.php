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
    $payload = Users_Session::generatePayload();
    $redirect = Users_Session::getRedirectFromPayload($payload);

    return compact("payload", "redirect");
}