<?php

function Cards_before_Q_responseExtras()
{
	Q_Response::addScript('Q/plugins/Cards/js/Cards.js', 'Cards');
	Q_Response::addStylesheet("Q/plugins/Cards/css/Cards.css", 'Cards');
}
