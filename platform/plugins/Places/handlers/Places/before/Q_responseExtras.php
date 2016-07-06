<?php

function Places_before_Q_responseExtras()
{
	Q_Response::addScript('plugins/Places/js/Places.js');
	Q_Response::addStylesheet("plugins/Places/css/Places.css");
	if ($key = Q_Config::get('Places', 'google', 'keys', 'web', null)) {
		Q_Response::setScriptData("Q.plugins.Places.loadGoogleMaps.key", $key);
	}
	$miles = Q_Config::expect('Places', 'nearby', 'miles');
	Q_Response::setScriptData("Q.plugins.Places.nearby.miles", $miles);
	$defaultMiles = Q_Config::expect('Places', 'nearby', 'defaultMiles');
	Q_Response::setScriptData("Q.plugins.Places.nearby.defaultMiles", $defaultMiles);
}
