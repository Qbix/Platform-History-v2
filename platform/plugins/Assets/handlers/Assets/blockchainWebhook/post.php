<?php

function Assets_blockchainWebhook_post()
{

    if(count($_REQUEST) === 0) {
        $blockData = file_get_contents('php://input');
    } else {
        $blockData = json_encode($_REQUEST);
    }
    Q::log($blockData, 'blockchain');
    http_response_code(200); // PHP 5.4 or greater
    exit;

}