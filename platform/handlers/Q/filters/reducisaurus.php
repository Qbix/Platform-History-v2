<?php

function Q_filters_reducisaurus($params)
{
	$parts = $params['parts'];
	$dest = $params['dest'];
	$processed = $params['processed'];
	
	$service_url = "http://reducisaurus.appspot.com/css";
	$options = array(
		'file' => implode("\n\n", $processed)
	);
	$result = Q_Utils::post($service_url, $options);
	if ($error = substr($result, 0, 5) === 'Error') {
		throw new Q_Exception(
			"Reducisaurus:\n" . $result
		);
	}
	return $result;
}