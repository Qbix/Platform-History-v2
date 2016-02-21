<?php

function Q_response_cordova() {
		// Add some javascript to inform the front end of important URLs	
		Q::event('Q/responseExtras');
}