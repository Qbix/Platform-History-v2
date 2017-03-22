<?php

function Streams_total_response()
{
	foreach (Q_Request::slotNames() as $sn) {
		Q_Response::setSlot($sn, Q::event("Streams/total/response/$sn"));
	}
}