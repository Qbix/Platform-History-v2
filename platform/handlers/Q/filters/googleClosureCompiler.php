<?php

function Q_filters_googleClosureCompiler($params)
{
	$results = $filters = array();
	$printProgress = Q::ifset($params, 'printProgress', false);
	foreach ($params['parts'] as $src => $part) {
		$compilation_level = Q::ifset($params, 'compilation_level', 'SIMPLE_OPTIMIZATIONS');

		if ($printProgress) {
			echo "\tQ_filters_googleClosureCompiler: $src" . PHP_EOL;
		}

		if (Q::endsWith($src, '.min.js')) {
			$results[$src] = $part . PHP_EOL; // already minified
			continue;
		}

		if (Q::ifset($params, 'installedLocally', false)) {
			$in = APP_FILES_DIR.'_combine_temporary_in.js';
			$out = APP_FILES_DIR.'_combine_temporary_out.js';
			file_put_contents($in, $part);
			$js = Q_SCRIPTS_DIR . DS . 'googleClosureCompiler.js';
			exec("node $js $in $out $compilation_level");
			$results[$src] = file_get_contents($out);
			unlink($in);
			unlink($out);
			if (!$in or $out) {
				continue;
			}
		}
	
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
		if (substr($compiled, 0, 5) === 'Error') {
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

		$results[$src] = $compiled;
		$filters[$src] = 'Q/filters/googleClosureCompiler';
	}
	
	$output = implode("\n\n", $results);
	$params['info']['output'] = $output;
	$params['info']['results'] = $results;
	$params['info']['filters'] = $filters;

	return $output;
}