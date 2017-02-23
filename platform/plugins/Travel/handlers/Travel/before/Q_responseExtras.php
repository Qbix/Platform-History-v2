<?php

function Travel_before_Q_responseExtras()
{
	Q_Response::addScript('plugins/Travel/js/Travel.js');
	Q_Response::addStylesheet("plugins/Travel/css/Travel.css");
}
