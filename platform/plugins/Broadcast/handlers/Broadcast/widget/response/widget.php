<?php

function Broadcast_widget_response_widget()
{
	if (!empty($_REQUEST['css'])) {
		Q_Response::addStylesheet($_REQUEST['css']);
	}
	$explanation = Q::ifset($_REQUEST, 'explanation', Q_Config::get('Broadcast', 'text', 'explanation', ''));
	$button = Q::ifset($_REQUEST, 'button', Q_Config::get('Broadcast', 'text', 'button', ''));
	$checkbox = Q::ifset($_REQUEST, 'checkbox', Q_Config::get('Broadcast', 'text', 'checkbox', ''));
	Q_Response::addScript('plugins/Broadcast/js/Broadcast.js');
	return Q::view('Broadcast/widget/widget.php', compact('explanation', 'button', 'checkbox'));
}