<?php

function Assets_before_Streams_Stream_save_Assets_credits($params)
{
    $row = $params['stream'];
    $amount = $stream->getAttribute('amount', null);
    $peak = $stream->getAttribute('peak', 0);
    if (isset($amount)) {
        $stream->setAttribute('peak', max($peak, $amount));
    }
}