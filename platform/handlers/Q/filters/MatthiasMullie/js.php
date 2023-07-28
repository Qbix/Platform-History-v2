<?php

function Q_filters_MatthiasMullie_js($params)
{
	$results = array();
	$printProgress = Q::ifset($params, 'printProgress', false);
	$filters = array();
	foreach ($params['parts'] as $src => $part) {
		if ($printProgress) {
			echo "\tQ_filters_MatthiasMullie_js: $src" . PHP_EOL;
		}
		try {
			$minify = new MatthiasMullie\Minify\JS($part);
		} catch (Exception $e) {

		}
		$results[$src] = $minify->minify();
		$filters[$src] = 'Q/filters/MatthiasMullie/js';
	}

	$output = implode("\n\n", $results);
	$params['info']['output'] = $output;
	$params['info']['results'] = $results;
	$params['info']['filters'] = $filters;

	return $output;
}