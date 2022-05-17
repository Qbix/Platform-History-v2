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
	Q_Response::setScriptData('Q.plugins.Assets.credits.bonus', Q_Config::get('Assets', 'credits', 'bonus', null));

	if (!empty($_GET['browsertab']) && $_GET['browsertab'] == 'yes') {
		Q::event('Assets/browsertab/response/content');
	}

	// blockchain data
	Q_Response::setScriptData('Q.plugins.Assets.NFT.contract.streamName', Assets_NFT_Contract::$streamName);
	Q_Response::setScriptData('Q.plugins.Assets.NFT.series.categoryStreamName', Assets_NFT_Series::$categoryStreamName);
	Q_Response::setScriptData('Q.plugins.Assets.NFT.series.relationType', Assets_NFT_Series::$relationType);
	Q_Response::setScriptData('Q.plugins.Assets.NFT.series.streamType', Assets_NFT_Series::$streamType);
	Q_Response::setScriptData('Q.plugins.Assets.NFT.chains', Assets_NFT::getChains());
	Q_Response::setScriptData('Q.plugins.Assets.NFT.relationType', Assets_NFT::$relationType);
	Q_Response::setScriptData('Q.plugins.Assets.NFT.currencies', Q_Config::get("Assets", "NFT", "currencies", array()));

	Q_Response::setScriptData('Q.plugins.Assets.NFT.icon', Q_Config::expect("Q", "images", "NFT/icon"));
	Q_Response::setScriptData('Q.plugins.Assets.NFT.series.icon', Q_Config::expect("Q", "images", "NFT/series/icon"));

	Q_Response::setScriptData('Q.plugins.Assets.NFT.contract.allow.author', Q_Config::get("Assets", "NFT", "contract", "allow", "author", true));
	Q_Response::setScriptData('Q.plugins.Assets.NFT.URI.base', Q_Config::get("Assets", "NFT", "URI", "base", array()));
	Q_Response::setScriptData('Q.plugins.Assets.NFT.URI.suffix', Q_Config::get("Assets", "NFT", "URI", "suffix", array()));
}
