<?php

// Check input
$argc = $_SERVER['argc'];
$argv = $_SERVER['argv'];
$usage = "Usage: php $argc[0] [-f] outfile relativedir1, ...\n";
$argc_min = 3;
$argc_outfile = 1;
$argc_dirs = 2;
$arg_options = array();
if (strlen($argv[1]) > 0 and $argv[1][0] == '-') {
	$arg_options = array_flip(str_split($argv[1]));
	++$argc_min;
	++$argc_outfile;
	++$argc_dirs;
}
if ($argc < $argc_min) {
	die("$usage");
}
$arg_outfile = $argv[$argc_outfile];
$arg_dirs = array_slice($argv, $argc_dirs);

// sanity checks
if (!isset($arg_options['f'])
 and file_exists($arg_outfile) 
 and !is_dir($arg_outfile)) {
	die("File already exists: $arg_outfile\n");
}

// include Q
include(dirname(__FILE__).DIRECTORY_SEPARATOR.'Q.inc.php');

// Get the include path after all the setup has been done
$gip = explode(PATH_SEPARATOR, get_include_path());

// These will be filled
$all_files = array();
$all_dirs = array();
$processed_realpaths = array();

// Do a Breadth First Search within the requested dirs
foreach ($arg_dirs as $arg_dir) {
	// Files earlier in include path will override later ones
	foreach (array_reverse($gip) as $path) {
		if (substr($path, -1) != DS) {
			$path .= DS;
		}
		$path_len = strlen($path);
		$remaining = array($path.$arg_dir);
		while ($remaining) {
			$dir = array_shift($remaining);
			if (substr($dir, -1) != DS) {
				$dir .= DS;
			}
			foreach (glob($dir.'*') as $g) {
				$rg = realpath($g);
				$relative = substr($g, $path_len);
				$all_files[$relative] = $rg;
				if (!is_dir($g)) {
					continue;
				}
				if (isset($processed_realpaths[$rg])) {
					continue;
				}
				$all_dirs[$relative] = $rg;
				$processed_realpaths[$rg] = true;
				$remaining[] = $rg;
			}
		};
	}
}

if (isset($arg_options['f'])) {
	$outfile = fopen($arg_outfile, 'w');
	foreach ($all_files as $file) {
		$contents = file_get_contents($file);
		if (!$contents) continue;
		if (substr($contents, 0, 5) == '<?php') {
			$contents .= "?>";
		}
		fwrite($outfile, $contents);
	}
	fclose($outfile);
} else {
	if (!file_exists($arg_outfile)) {
		mkdir($arg_outfile, 0755);
	}
	foreach ($all_dirs as $r => $d) {
		$dir = $arg_outfile.DS.$r;
		if (!file_exists($dir)) {
			mkdir($dir, 0755, true);
		}
	}
	foreach ($all_files as $r => $f) {
		if (is_dir($f)) continue;
		$f_sh = escapeshellarg($f);
		$r_sh = escapeshellarg($arg_outfile.DS.$r);
		shell_exec("cp $f_sh $r_sh");
	}
}

