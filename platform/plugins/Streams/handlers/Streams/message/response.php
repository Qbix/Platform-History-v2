<?php

function Streams_message_response()
{
	foreach (Q_Request::slotNames() as $sn) {
		Q_Response::setSlot($sn, Q::event("Streams/message/response/$sn"));
	}
}