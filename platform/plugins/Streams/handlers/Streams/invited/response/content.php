<?php

function Streams_invited_response_content()
{
    // this is sometimes invoked by the app's Q/response/content
    return Q::event('Streams/invited/response');
}