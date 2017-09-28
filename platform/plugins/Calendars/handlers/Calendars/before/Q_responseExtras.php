<?php

function Calendars_before_Q_responseExtras()
{
	Q_Response::addScript('{{Calendars}}/js/Calendars.js');
	Q_Response::addStylesheet("{{Calendars}}/css/Calendars.css");
	$defaults = Q_Config::expect('Calendars', 'events', 'defaults');
	Q_Response::setScriptData('Calendars.events', $defaults);
}
