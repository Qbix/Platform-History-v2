<?php
include 'Auto.php';
include 'Human.php';

class Translate
{

	private $adapter;

	function __construct()
	{
		// get all CLI options
		$this->options = $this->getOptions();
		if (isset($this->options['help'])) {
			$this->printHelp();
			exit;
		}
		$this->initAdapter();
		// get all locales from json config
		$this->locales = $this->getLocales();
		$this->adapter->saveAll();
	}

	function getSrc($lang, $locale)
	{
		$arr = array();
		if (!is_dir($this->options['in'])) {
			die("No such source directory\n");
		}
		$objects = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($this->options['in'], RecursiveDirectoryIterator::SKIP_DOTS), RecursiveIteratorIterator::SELF_FIRST);
		foreach ($objects as $filename => $object) {
			if (basename($filename) === $lang . ($locale ? '-' . $locale : '') . '.json') {
				$tree = new Q_Tree();
				$tree->load($filename);
				$all = $tree->getAll();
				$res = array();
				$srcPath = ltrim(str_replace($this->options['in'], "", $filename), '/');
				$this->flatten($srcPath, $all, $res);
				$arr = array_merge($arr, $res);
			}
		}
		if (!sizeof($arr)) {
			die("No source files found for " . $lang . ($locale ? '-' . $locale : '') . "\n");
		}
		return $arr;
	}

	function createDirectory($dir)
	{
		$dir = $this->joinPaths($this->options['out'], $dir);
		if (!is_dir($dir)) {
			mkdir($dir, 0755, true);
		}
		return $dir;
	}

	function joinPaths()
	{
		$paths = array();
		foreach (func_get_args() as $arg) {
			if ($arg !== '') {
				$paths[] = $arg;
			}
		}
		return preg_replace('#/+#', DS, join(DS, $paths));
	}

	function arrayToBranch($arr)
	{
		$key = array_shift($arr);
		if (!sizeof($arr)) {
			return $key;
		} else {
			return array($key => Translate::arrayToBranch($arr));
		}
	}

	protected function getOptions()
	{
		$params = array(
			'h::' => 'help::',
			's::' => 'source::',
			'i::' => 'in::',
			'o::' => 'out::',
			'n::' => 'null::',
			'f::' => 'format::'
		);
		$options = getopt(implode('', array_keys($params)), $params);
		$textFolder = realpath(dirname(__FILE__) . DIRECTORY_SEPARATOR . '../../../text');
		if (empty($options['in'])) {
			$options['in'] = $textFolder;
		}
		if (empty($options['out'])) {
			$options['out'] = $textFolder;
		};
		if (empty($options['source'])) {
			$options['source'] = 'en';
		};
		if (empty($options['format'])) {
			$options['format'] = 'auto';
		};
		return $options;
	}

	protected function getLocales()
	{
		$tree = new Q_Tree();
		$tree->load(Q_CONFIG_DIR . DS . 'Q' . DS . 'locales.json');
		return $tree->getAll();
	}

	protected function printHelp()
	{
		$help = <<<EOT

This script automatically translates app interface into various languages or prepares json files for human translators.

You can use such options:

--source   Use language code as a value. The value can be combined with location code.
           Examples:
           --source=en-US
           --source=ru-UA
           --source=ru

--in       Input directory which contains source json files.
           Example:
           --in=/home/user/input

--out      Output directory.
           Example:
           --out=/home/user/output

--format   Can be "auto" or "human". Default value is "auto".
           "auto" automatically translates files using Google Translation API.
           "human" prepares files for further human translators.
           Examples:
           --format=auto
           --format=human


EOT;
		print $help;
	}

	protected function flatten($filename, $arr, & $res = null, & $key = [])
	{
		foreach ($arr as $itemKey => $item) {
			$key[] = $itemKey;
			if (is_array($item)) {
				$this->flatten($filename, $item, $res, $key);
			} else {
				$res[] = array(
					"dirname" => pathinfo($filename)['dirname'],
					"key" => $key,
					"value" => $item,
					"original" => $item
				);
			}
			array_pop($key);
		}
	}

	protected function initAdapter() {

		switch ($this->options['format'])
		{
			case 'auto':
				$this->adapter = new Auto($this);
				break;
			case 'human':
				$this->adapter = new Human($this);
				break;
			default:
				die("Unknown format value\n");
		}
	}

}

