<?php

function Q_init()
{	
	if (Q_Config::get('MyApp', 'debugging', false)) {
		// sometimes the APC can cause files to appear missing
		// if they were created after it tried to load them once
		Q_Cache::clear(true);
		Q_Response::setScriptData('Q.plugins.Streams.refresh.options.duringEvents', array(
			'replace' => array()
		));
		Q_Response::setScriptData('Q.plugins.Streams.refresh.options.preventAutomatic', true);
	}
}
