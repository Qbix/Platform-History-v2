<?php

function Places_before_Q_responseExtras()
{
	Q_Response::addScript('plugins/Places/js/Places.js');
	Q_Response::addStylesheet("plugins/Places/css/Places.css");
	if ($key = Q_Config::get('Places', 'google', 'keys', 'web', null)) {
		Q_Response::setScriptData("Q.Places.loadGoogleMaps.key", $key);
	}
}
