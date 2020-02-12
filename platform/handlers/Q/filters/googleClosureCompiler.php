<?php

function Q_filters_googleClosureCompiler($params)
{
	$content = implode("\n\n", $params['parts']);
	$compilation_level = isset($params['compilation_level'])
		? $params['compilation_level']
		: 'SIMPLE_OPTIMIZATIONS';
	
	// $in = APP_FILES_DIR.'_combine_temporary_in.js';
	// $out = APP_FILES_DIR.'_combine_temporary_out.js';
	// file_put_contents($in, $content);
	// $js = Q_SCRIPTS_DIR . DS . 'googleClosureCompiler.js';
	// exec("node $js $in $out $compilation_level");
	// $result = file_get_contents($out);
	// unlink($in);
	// unlink($out);
	// if (!$in or $out) {
	// 	return $result;
	// }
	
	// fall back to using Google's online service
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
	$result = Q_Utils::post($service_url, $options, null, array(), null, $timeout);
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