<?php

function Websites_before_Q_Uri_toUrl($params, &$result)
{
	$routes = Q_Config::get('Websites', 'permalinks', 'routes', array());
	if (!in_array($params['route'], $routes)) {
		$uri = $params['uri'];
		$actions = Q_Config::get('Websites', 'permalinks', 'actions', array());
		if (empty($actions[$uri->module])
		or empty($actions[$uri->module][$uri->action])) {
			return;
		}
	}
	$wp = new Websites_Permalink();
	$wp->uri = (string)$params['source'];
	if ($wp->retrieve()) {
		$result = $wp->url;
	}
}