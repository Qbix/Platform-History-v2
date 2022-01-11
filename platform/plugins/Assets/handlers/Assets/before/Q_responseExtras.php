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
	$chains = Q_Config::get("Users", "apps", "web3", array());
	$currencies = Q_Config::get("Assets", "web3", "currencies", array());
	$chainsClient = array();
	foreach ($chains as $i => $chain) {
		// if contract or rpcUrls undefined, skip this chain
		$contract = Q::ifset($chain, "contracts", "NFT", "address", null);
		$rpcUrl = Q::ifset($chain, "rpcUrl", null);
		$infuraId = Q::ifset($chain, "providers", "walletconnect", "infura", "projectId", null);
		$blockExplorerUrl = Q::ifset($chain, "blockExplorerUrl", null);
		$chainId = Q::ifset($chain, "appId", null);

		if (!$contract || !$rpcUrl) {
			unset($chain[$i]);
			continue;
		}

		$rpcUrl = Q::interpolate($rpcUrl, compact("infuraId"));
		$temp = compact("chainId", "contract", "rpcUrl", "blockExplorerUrl");

		foreach ($currencies as $currency) {
			if ($currency[$chainId] == "0x0000000000000000000000000000000000000000") {
				$temp["currency"] = $currency;
				$temp["currency"]["token"] = $currency[$chainId];
				break;
			}
		}

		$temp["default"] = $i == Users::communityId();

		$chainsClient[$chainId] = $temp;
	}
	Q_Response::setScriptData('Q.plugins.Assets.Web3.NFT.chains', $chainsClient);
	Q_Response::setScriptData('Q.plugins.Assets.Web3.NFT.currencies', $currencies);

	// set Assets.Web3.NFT.icon.sizes for imagepicker
	Q_Response::setScriptData('Q.plugins.Assets.Web3.NFT.icon', Q_Config::expect("Q", "images", "NFT/icon"));

}
