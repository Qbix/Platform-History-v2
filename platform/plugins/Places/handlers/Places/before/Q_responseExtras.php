<?php

function Places_before_Q_responseExtras()
{
	Q_Response::addScript('Q/plugins/Places/js/Places.js', 'Places');
	Q_Response::addStylesheet("Q/plugins/Places/css/Places.css", 'Places');
	if ($key = Q_Config::get('Places', 'google', 'keys', 'web', null)) {
		Q_Response::setScriptData("Q.plugins.Places.loadGoogleMaps.key", $key);
	}
	$meters = Q_Config::expect('Places', 'nearby', 'meters');
	Q_Response::setScriptData("Q.plugins.Places.nearby.meters", $meters);
	$defaultMeters = Q_Config::expect('Places', 'nearby', 'defaultMeters');
	Q_Response::setScriptData("Q.plugins.Places.nearby.defaultMeters", $defaultMeters);
}
