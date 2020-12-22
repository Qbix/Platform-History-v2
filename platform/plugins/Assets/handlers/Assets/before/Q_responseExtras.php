<?php

function Assets_before_Q_responseExtras() {
	Q_Response::addStylesheet('{{Assets}}/css/Assets.css', 'Assets');
	Q_Response::addScript('{{Assets}}/js/Assets.js?'.filemtime(ASSETS_PLUGIN_WEB_DIR.DS.'js/Assets.js'), 'Assets');

	Q_Response::setScriptData('Q.plugins.Assets.Credits.amount', Assets_Credits::amount());
	Q_Response::setScriptData('Q.plugins.Assets.Credits.exchange', Q_Config::expect('Assets', 'credits', 'exchange'));

	if ($publishableKey = Q_Config::get('Assets', 'payments', 'stripe', 'publishableKey', null)) {
		if ($jsLibrary = Q_Config::get('Assets', 'payments', 'stripe', 'jsLibrary', null)) {
			Q_Response::setScriptData('Q.plugins.Assets.Payments.stripe.jsLibrary', $jsLibrary);
		}
		Q_Response::setScriptData('Q.plugins.Assets.Payments.stripe.publishableKey', $publishableKey);

		$applPayMerchantId = Q_Config::get('Assets', 'payments', 'applePay', 'merchantIdentifier', null);
		if ($applPayMerchantId) {
			Q_Response::setScriptData('Q.plugins.Assets.Payments.applePay.merchantIdentifier', $applPayMerchantId);
		}

		Q_Response::setScriptData('Q.plugins.Assets.Payments.googlePay', Q_Config::get('Assets', 'payments', 'googlePay', null));
		Q_Response::setScriptData('Q.plugins.Assets.Payments.stripe.version', Q_Config::get('Assets', 'payments', 'stripe', 'version', null));
	}

	Q_Response::setScriptData('Q.plugins.Assets.service.relatedParticipants', Q_Config::get('Assets', 'service', 'relatedParticipants', null));

	if (!empty($_GET['browsertab']) && $_GET['browsertab'] == 'yes') {
		Q::event('Assets/browsertab/response/content');
	}
}