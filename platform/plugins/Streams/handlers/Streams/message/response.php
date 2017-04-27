<?php

function Streams_message_response()
{
	$slotNames = Q_Request::slotNames();
	sort($slotNames);
	foreach ($slotNames as $sn) {
		if (Q_Response::getSlot($sn) === null) {
			Q_Response::setSlot($sn, Q::event("Streams/message/response/$sn"));
		}
	}
}