<?php

function Q_filters_googleClosureCompiler($params)
{
	$content = implode("\n\n", $params['parts']);
	$compilation_level = isset($params['compilation_level'])
		? $params['compilation_level']
		: 'SIMPLE_OPTIMIZATIONS';
	$service_url = "https://closure-compiler.appspot.com/compile";
	$options = array(
		'js_code' => $content,
		'compilation_level' => $compilation_level,
		'output_format' => 'text',
		'output_info' => 'compiled_code'
	);
	$environment = Q_Config::get('Q', 'environment', '');
	$config = Q_Config::get('Q', 'environments', $environment, 'js', array());
	$timeout = isset($config['timeout'])
		? $config['timeout']
		: Q_Config::get('Q', 'environments', '*', 'js', 'timeout', 600);
	$result = Q_Utils::post($service_url, $options, null, $timeout);
	if ($error = substr($result, 0, 5) === 'Error') {
		throw new Q_Exception(
			"Google Closure Compiler:\n" . $result
		);
	}
	if (!trim($result)) {
		$options['output_info'] = 'errors';
		throw new Q_Exception(
			"Google Closure Compiler:\n" . Q_Utils::post($service_url, $options)
		);
	}
	return $result;
}