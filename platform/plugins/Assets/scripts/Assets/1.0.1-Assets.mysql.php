<?php

function Assets_1_0_1()
{
	$from = ASSETS_PLUGIN_WEB_DIR.DS.'.well-known';
	$to = APP_WEB_DIR.DS.'.well-known';
	if (!file_exists($to)) {
		mkdir($to, 0755);
		Q_Utils::copy($from, $to);
	}
}

Assets_1_0_1();