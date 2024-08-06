<?php

function Assets_after_Streams_Stream_exportArray($params, &$result)
{
    $result['Assets/canPayForStreams'] = Assets::canPayForStreams($params['stream']);
}