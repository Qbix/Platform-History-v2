<?php

function Cards_before_Q_responseExtras()
{
	Q_Response::addScript('{{Cards}}/js/Cards.js', 'Cards');
	Q_Response::addStylesheet("{{Cards}}/css/Cards.css", 'Cards');
	Q_Response::setScriptData("Q.plugins.Cards.keys.web", Q_Config::get('Cards', 'google', 'keys', 'web', null));
}
