<?php

function Streams_message_response_totals($options) {
	return Q::event('Streams/total/response/totals', $options);
}