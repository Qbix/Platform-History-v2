<?php

function Websites_before_Q_url($params, &$result)
{
	$wp = new Websites_Permalink();
	$wp->uri = (string)$params['source'];
	if ($wp->retrieve()) {
		$result = $wp->url;
	}
}