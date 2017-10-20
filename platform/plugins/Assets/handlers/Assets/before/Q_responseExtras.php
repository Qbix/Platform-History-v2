<?php

function Assets_before_Q_responseExtras() {
	Q_Response::addScript('{{Assets}}/js/Assets.js');

	try {
		$amount = Assets_Credits::amount();
	} catch (Exception $e) {
		$amount = null;
	}
	Q_Response::setScriptData('Q.plugins.Assets.credits', compact('amount'));

	if ($publishableKey = Q_Config::get('Assets', 'payments', 'stripe', 'publishableKey', null)) {
		if ($jsLibrary = Q_Config::get('Assets', 'payments', 'stripe', 'jsLibrary', null)) {
			Q_Response::setScriptData('Q.plugins.Assets.Payments.stripe.jsLibrary', $jsLibrary);
		}
		if ($jsLibrary && Q_Config::get('Assets', 'payments', 'stripe', 'preloadAPI', true)) {
			Q_Response::addScript($jsLibrary);
		}
		Q_Response::setScriptData('Q.plugins.Assets.Payments.stripe.publishableKey', $publishableKey);
		Q_Response::setScriptData('Q.plugins.Assets.Payments.androidPay', Q_Config::get('Assets', 'payments', 'androidPay', null));
		Q_Response::setScriptData('Q.plugins.Assets.Payments.stripe.version', Q_Config::get('Assets', 'payments', 'stripe', 'version', null));
	}
}