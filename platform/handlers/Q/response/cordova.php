<?php

function Q_response_cordova() {
	// Add some javascript to inform the front end of important URLs	
	Q::event('Q/responseExtras');
	if (Q_Response::withSessionExtras()) {
		Q_Response::captureScriptDataForSession(true);
		Q::event('Q/sessionExtras');
		Q_Response::captureScriptDataForSession(false);
	}
}