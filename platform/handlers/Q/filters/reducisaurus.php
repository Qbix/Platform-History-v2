<?php

function Q_filters_reducisaurus($params)
{
	$service_url = "http://reducisaurus.appspot.com/css";

	$processed = $params['processed'];
	$results = array();
	$printProgress = Q::ifset($params, 'printProgress', false);
	$filters = array();
	foreach ($processed as $src => $part) {
		if ($printProgress) {
			echo "\Q_filters_reducisaurus: $src" . PHP_EOL;
		}
		$results[$src] = Q_Utils::post($service_url, array(
			'file' => $part
		));
		$filters[$src] = 'Q/filters/reducisaurus';
	}

	$output = implode("\n\n", $results);
	$params['info']['output'] = $output;
	$params['info']['results'] = $results;
	$params['info']['filters'] = $filters;

	return $output;
}