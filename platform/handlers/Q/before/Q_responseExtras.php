<?php

/**
 * This is the default handler for the Q/responseExtras event.
 * It should not send session data like the nonce, which prevents CSRF
 * attacks. For that, see the Q/sessionExtras handler.
 */
function Q_before_Q_responseExtras()
{
	$app = Q::app();
	$uri = Q_Dispatcher::uri();
	$url = Q_Request::url(true);
	$base_url = Q_Request::baseUrl();
	$cache_base_url = Q_Config::get('Q', 'response', 'cacheBaseUrl', null);
	$ajax = Q_Request::isAjax();
	if (!$uri) {
		return;
	}
	$languages = Q_Request::languages();
	$info = array(
		'url' => $url,
		'uriString' => (string)$uri
	);
	if ($uri) {
		$info['uri'] = $uri->toArray();
	}
	$info = array_merge(
		$info,
		array(
			'proxies' => Q_Config::get('Q', 'proxies', array()),
			'baseUrl' => $base_url,
			'proxyBaseUrl' => Q_Uri::url($base_url),
			'cacheBaseUrl' => Q_Uri::url($cache_base_url),
			'proxyUrl' => Q_Uri::url($url)
		)
	);
	foreach ($info as $k => $v) {
		Q_Response::setScriptData("Q.info.$k", $v);
	}
}
