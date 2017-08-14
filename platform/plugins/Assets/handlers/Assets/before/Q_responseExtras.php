<?php

function Assets_before_Q_responseExtras() {
	Q_Response::addScript('Q/plugins/Assets/js/Assets.js');

	try {
		$amount = Assets_Credits::amount();
	} catch (Exception $e) {
		$amount = null;
	}
	Q_Response::setScriptData('Q.plugins.Assets.credits', compact('amount'));

	if ($publishableKey = Q_Config::get('Assets', 'payments', 'stripe', 'publishableKey', null)) {
		Q_Response::addScript('https://js.stripe.com/v2/');
		Q_Response::setScriptData('Q.plugins.Assets.Payments.stripe.publishableKey', $publishableKey);
		Q_Response::setScriptData('Q.plugins.Assets.Payments.androidPay', Q_Config::get('Assets', 'payments', 'androidPay', null));
		Q_Response::setScriptData('Q.plugins.Assets.Payments.stripe.version', Q_Config::get('Assets', 'payments', 'stripe', 'version', null));
	}
}