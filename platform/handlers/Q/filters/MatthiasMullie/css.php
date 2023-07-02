<?php

function Q_filters_MatthiasMullie_css($params)
{
	$processed = $params['processed'];
	$results = array();
	$printProgress = Q::ifset($params, 'printProgress', false);
	$filters = array();
	foreach ($processed as $src => $part) {
		if ($printProgress) {
			echo "\tQ_filters_MatthiasMullie_css: $src" . PHP_EOL;
		}
		try {
			$minify = new MatthiasMullie\Minify\CSS($part);
		} catch (Exception $e) {

		}
		$results[$src] = $minify->minify();
		$filters[$src] = 'Q/filters/MatthiasMullie/css';
	}

	$output = implode("\n\n", $results);
	$params['info']['output'] = $output;
	$params['info']['results'] = $results;
	$params['info']['filters'] = $filters;

	return $output;
}