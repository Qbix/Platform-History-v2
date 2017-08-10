<?php

function Q_init()
{
	if (!empty($_SERVER['HTTP_HOST'])) {
		// the following statement causes the session to be opened for every request
		Q_Session::setNonce();
	}

	if (Q_Config::get('MyApp', 'testing', false)) {
		// sometimes the APC can cause files to appear missing
		// if they were created after it tried to load them once
		if (Q_Cache::$apcType) {
			(Q_Cache::$apcType . '_clear_cache')('user');
		}
	}
}