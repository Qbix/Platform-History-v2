<?php

function Assets_after_Streams_Stream_exportArray($params, &$result)
{
    $result['Assets/canPayForStream'] = Assets::canPayForStream($params['stream']);
}