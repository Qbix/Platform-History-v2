<?php

function Q_filters_cssminifier($params)
{
	$parts = $params['parts'];
	$dest = $params['dest'];
	
	$processed = array();
	foreach ($parts as $src => $content) {
		$dest_parts = explode('/', $dest);
		$src_parts = explode('/', $src);
		$j = 0;
		foreach ($dest_parts as $i => $p) {
			if (!isset($src_parts[$i]) or $src_parts[$i] !== $dest_parts[$i]) {
				break;
			}
			$j = $i+1;
		}
		$dc = count($dest_parts);
		$sc = count($src_parts);
		$relative = str_repeat("../", $dc-$j-1)
			. implode('/', array_slice($src_parts, $j, $sc-$j-1));
		if ($relative) {
			$relative .= '/';
		}
		$processed[$src] = preg_replace(
			"/url\((\'){0,1}/",
			'url($1'.$relative,
			$content
		);
	}
	
	$service_url = "http://cssminifier.com/raw";
	$options = array(
		'input' => implode("\n\n", $processed)
	);
	$result = Q_Utils::post($service_url, $options);
	if ($error = substr($result, 0, 5) === 'Error') {
		throw new Q_Exception(
			"Reducisaurus:\n" . $result
		);
	}
	return $result;
}