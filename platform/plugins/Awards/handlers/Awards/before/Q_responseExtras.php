<?php

function Awards_before_Q_responseExtras() {
	Q_Response::addScript('plugins/Awards/js/Awards.js');

	try {
		$amount = Awards_Credits::amount();
	} catch (Exception $e) {
		$amount = null;
	}
	Q_Response::setScriptData('Q.plugins.Awards.credits', compact('amount'));
}