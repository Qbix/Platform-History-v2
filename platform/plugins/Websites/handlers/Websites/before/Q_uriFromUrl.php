<?php

function Websites_before_Q_uriFromUrl($params, &$result)
{
	$wp = new Websites_Permalink();
	$wp->url = $params['url'];
	if ($wp->retrieve()) {
		$result = Q_Uri::from($wp->uri);
	}
}