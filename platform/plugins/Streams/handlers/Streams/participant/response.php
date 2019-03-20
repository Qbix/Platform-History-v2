<?php

function Streams_participant_response()
{
	foreach (Q_Request::slotNames() as $sn) {
		Q_Response::setSlot($sn, Q::event("Streams/participant/response/$sn"));
	}
}