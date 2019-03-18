<?php

function Q_filters_MatthiasMullie_css($params)
{
	$processed = $params['processed'];
	$css = implode("\n\n", $processed);
	$minify = new MatthiasMullie\Minify\CSS($css);
	return $minify->minify();
}