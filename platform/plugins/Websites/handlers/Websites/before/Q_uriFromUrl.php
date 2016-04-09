<?php

function Websites_before_Q_uriFromUrl($params, &$result)
{
	if (!Q::$bootstrapped) {
		return; // we probably haven't even loaded the database configuration yet.
	}
	$wp = new Websites_Permalink();
	$wp->url = $params['url'];
	if ($wp->retrieve()) {
		$result = Q_Uri::from($wp->uri);
	}
}