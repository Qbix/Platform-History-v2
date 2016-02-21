<?php

function Broadcast_widget_response()
{
	$app = Q_Config::expect('Q', 'app');
	Q_Config::set(
		'Q', 'response', 'layout', 'html', 
		"$app/layout/widget.php"
	);
	Q_Config::set(
		'Q', 'response', $app, 'slotNames',
		array('widget', 'title', 'notices')
	);
}