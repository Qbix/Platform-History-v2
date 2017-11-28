<?php

/**
 * This is the default handler for the Q/responseExtras event.
 * It should not be invoked during AJAX requests, and especially
 * not during JSONP requests. It will output things like the nonce,
 * which prevents CSRF attacks, but is only supposed to be printed
 * on our webpages and not also given to anyone who does a JSONP request.
 */
function Q_before_Q_responseExtras()
{
	$app = Q::app();
	$uri = Q_Dispatcher::uri();
	$url = Q_Request::url(true);
	$base_url = Q_Request::baseUrl();
	$ajax = Q_Request::isAjax();
	if (!$uri) {
		return;
	}
	$languages = Q_Request::languages();
	$info = array(
		'url' => $url,
		'uriString' => (string)$uri,
		'languages' => $languages
	);
	if ($uri) {
		$info['uri'] = $uri->toArray();
	}
	if (!$ajax) {
		$text = Q::take(Q_Config::get('Q', 'text', array()), array('useLocale'));
		$info = array_merge(
			array('app' => Q::app()),
			$info,
			array(
				'proxies' => Q_Config::get('Q', 'proxies', array()),
				'baseUrl' => $base_url,
				'proxyBaseUrl' => Q_Uri::url($base_url),
				'proxyUrl' => Q_Uri::url($url),
				'text' => $text,
				'sessionName' => Q_Session::name(),
				'nodeUrl' => Q_Utils::nodeUrl(),
				'socketPath' => Q_Utils::socketPath(),
				'slotNames' => Q_Config::get("Q", "response", "slotNames", array('content', 'dashboard', 'title', 'notices')),
			)
		);
	}
	foreach ($info as $k => $v) {
		Q_Response::setScriptData("Q.info.$k", $v);
	}
	if (!$ajax) {
		$uris = Q_Config::get('Q', 'javascript', 'uris', array());
		$urls = array();
		foreach ($uris as $u) {
			$urls["$u"] = Q_Uri::url("$u");
		}
		Q_Response::setScriptData('Q.urls', $urls);
	}

	// Export more variables to inline js
	$nonce = isset($_SESSION['Q']['nonce']) ? $_SESSION['Q']['nonce'] : null;
	if ($nonce) {
		Q_Response::setScriptData('Q.nonce', $nonce);
	}

	Q_Response::setScriptData('Q.allSlotNames', Q_Response::allSlotNames());
	
	// Attach stylesheets and scripts
	foreach (Q_Config::get('Q', 'javascript', 'responseExtras', array()) as $src => $b) {
		if (!$b) continue;
		Q_Response::addScript($src, 'Q');
	}
	foreach (Q_Config::get('Q', 'stylesheets', 'responseExtras', array()) as $src => $media) {
		if (!$media) continue;
		if ($media === true) {
			$media = 'screen,print';
		}
		Q_Response::addStylesheet($src, 'Q', $media);
	}
}
