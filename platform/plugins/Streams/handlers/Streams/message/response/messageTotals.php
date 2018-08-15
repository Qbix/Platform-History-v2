<?php

function Streams_message_response_messageTotals($options) {
	return Q::event('Streams/messageTotal/response/messageTotals', $options);
}