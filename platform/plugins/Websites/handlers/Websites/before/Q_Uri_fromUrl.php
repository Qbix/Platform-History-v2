<?php

function Websites_before_Q_Uri_fromUrl($params, &$result)
{
	$enabled = Q_Config::get('Websites', 'permalinks', 'regex', false);
	if (!$enabled || !Q::$bootstrapped) {
		return; // we probably haven't even loaded the database configuration yet.
	}
	if ($regex = Q_Config::get('Websites', 'permalinks', 'regex', null)) {
		$baseUrl = Q_Request::baseUrl();
		$tail = substr($params['url'], strlen($baseUrl)+1);
		if (!preg_match($regex, $tail)) {
			return;
		}
	}
	$wp = new Websites_Permalink();
	$wp->url = $params['url'];
	if ($wp->retrieve()) {
		$result = Q_Uri::from($wp->uri);
	}
}