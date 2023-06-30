<?php

function Q_filters_googleClosureCompiler($params)
{
	$results = array();
	$printProgress = Q::ifset($params, 'printProgress', false);
	foreach ($params['parts'] as $filename => $part) {
		$compilation_level = isset($params['compilation_level'])
			? $params['compilation_level']
			: 'SIMPLE_OPTIMIZATIONS';

		echo "\tGoogle Closure Compiler: $filename" . PHP_EOL;

		if (Q::endsWith($filename, '.min.js')) {
			$results[] = $part; // already minified
			continue;
		}

		// $in = APP_FILES_DIR.'_combine_temporary_in.js';
		// $out = APP_FILES_DIR.'_combine_temporary_out.js';
		// file_put_contents($in, $content);
		// $js = Q_SCRIPTS_DIR . DS . 'googleClosureCompiler.js';
		// exec("node $js $in $out $compilation_level");
		// $result = file_get_contents($out);
		// unlink($in);
		// unlink($out);
		// if (!$in or $out) {
		// 	continue;
		// }
	
		// fall back to using Google's online service
		$service_url = "https://closure-compiler.appspot.com/compile";
		$options = array(
			'js_code' => $part,
			'compilation_level' => $compilation_level,
			'output_format' => 'text',
			'output_info' => 'compiled_code'
		);
		$environment = Q_Config::get('Q', 'environment', '');
		$config = Q_Config::get('Q', 'environments', $environment, 'js', array());
		$timeout = isset($config['timeout'])
			? $config['timeout']
			: Q_Config::get('Q', 'environments', '*', 'js', 'timeout', 600);
		$compiled = Q_Utils::post($service_url, $options, null, array(), null, $timeout);
		if ($error = substr($compiled, 0, 5) === 'Error') {
			throw new Q_Exception(
				"Google Closure Compiler:\n" . $compiled
			);
		}
		if (!trim($compiled)) {
			$options['output_info'] = 'errors';
			throw new Q_Exception(
				"Google Closure Compiler:\n" . Q_Utils::post($service_url, $options)
			);
		}
		$results[] = $compiled;
	}
	return implode("\n\n", $results);
}