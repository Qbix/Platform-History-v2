<?php

function Q_filters_MatthiasMullie_js($params)
{
	$content = implode("\n\n", $params['parts']);
	$minify = new MatthiasMullie\Minify\JS($content);
	return $minify->minify();
}