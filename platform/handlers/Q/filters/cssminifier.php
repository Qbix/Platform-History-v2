<?php

function Q_filters_cssminifier($params, &$info = array())
{
	$service_url = "http://cssminifier.com/raw";

	$processed = $params['processed'];
	$results = array();
	$printProgress = Q::ifset($params, 'printProgress', false);
	$filters = array();
	foreach ($processed as $src => $part) {
		if ($printProgress) {
			echo "\Q_filters_cssminifier: $src" . PHP_EOL;
		}
		$results[$src] = Q_Utils::post($service_url, array(
			'input' => $part
		));
		$filters[$src] = 'Q/filters/cssminifier';
	}

	$output = implode("\n\n", $results);
	$params['info']['output'] = $output;
	$params['info']['results'] = $results;
	$params['info']['filters'] = $filters;

	return $output;
}