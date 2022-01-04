<?php

function Assets_blockchainWebhook_post()
{

    Q::log(json_encode($_REQUEST), 'blockchain');
    http_response_code(200); // PHP 5.4 or greater
    exit;

}