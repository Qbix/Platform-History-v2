<?php

function Q_before_Q_autoload ($params, &$filename)
{		
	// Workaround for Zend Framework, because it has require_once
	// in various places, instead of just relying on autoloading.
	// As a result, we need to add some more directories to the path.
	// The trigger is that we will be loading a file beginning with "classes/Zend".
	// This is handled natively inside this method for the purpose of speed.
	$paths = array('classes/Zend/' => 'classes');
	static $added_paths = array();
	foreach ($paths as $prefix => $new_path) {
		if (substr($filename, 0, strlen($prefix)) != $prefix) {
			continue;
		}
		if (isset($added_paths[$new_path])) {
			break;
		}
		$abs_filename = Q::realPath($filename);
		$new_path_parts = array();
		$prev_part = null;
		foreach (explode(DS, $abs_filename) as $part) {
			if ($prev_part == 'classes' and $part == 'Zend') {
				break;
			}
			$prev_part = $part;
			$new_path_parts[] = $part;
		}
		$new_path = implode(DS, $new_path_parts);
        $paths = array($new_path, get_include_path());
        set_include_path(implode(PS, $paths));
		$added_paths[$new_path] = true;
	}
}