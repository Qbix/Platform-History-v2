<?php

function Streams_messageTotal_response()
{
	foreach (Q_Request::slotNames() as $sn) {
		Q_Response::setSlot($sn, Q::event("Streams/messageTotal/response/$sn"));
	}
}