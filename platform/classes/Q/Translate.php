<?php

/**
 * @property array options
 */
class Q_Translate
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
			// try relative path
			$path = APP_SCRIPTS_DIR . DS .

			die("No such source directory: " . $this->options['in'] . "\n");
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
			return array($key => Q_Translate::arrayToBranch($arr));
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
		$textFolder = APP_DIR . DS . 'text' . DS . CONFIGURE_ORIGINAL_APP_NAME;
		if (empty($options['in'])) {
			$options['in'] = $textFolder;
		} else {
			// relative path
			if (substr($options['in'], 0, 1) === '.') {
				$options['in'] = APP_SCRIPTS_DIR . DS . 'Q' . DS .$options['in'];
			}
		}
		if (empty($options['out'])) {
			$options['out'] = APP_DIR . DS . 'translations';
		} else {
			// relative path
			if (substr($options['in'], 0, 1) === '.') {
				$options['out'] = APP_SCRIPTS_DIR . DS . 'Q' . DS .$options['out'];
			}
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
		$platformLocalesConfig = Q_CONFIG_DIR . DS . 'Q' . DS . 'locales.json';
		$appLocalesConfig = APP_CONFIG_DIR . DS . 'locales.json';
		$config = null;
		if (file_exists($appLocalesConfig)) {
			$config = $tree->load($appLocalesConfig);
		} elseif (file_exists($platformLocalesConfig)) {
			$config = $tree->load($platformLocalesConfig);
		}
		if (!$config) {
			throw new Exception('Empty locales.json');
		}
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
				$this->adapter = new Q_TranslateGoogle($this);
				break;
			case 'human':
				$this->adapter = new Q_TranslateHuman($this);
				break;
			default:
				die("Unknown format value\n");
		}
	}

}

