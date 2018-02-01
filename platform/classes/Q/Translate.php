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
			'f::' => 'format::',
			'g::' => 'google-format::'
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
			$options['format'] = 'google';
		};
		if (!empty($options['google-format'])) {
			$options['google-format'] = in_array($options['google-format'], array('text', 'html')) ? $options['google-format'] : 'html';
		} else {
			$options['google-format'] = 'html';
		}
		return $options;
	}

	protected function getLocales()
	{
		$tree = new Q_Tree();
		$appLocalConfig = APP_LOCAL_DIR . DS . 'locales.json';
		$appConfig = APP_CONFIG_DIR . DS . 'locales.json';
		$platformConfig = Q_CONFIG_DIR . DS . 'Q' . DS . 'locales.json';
		$config = null;
		if (file_exists($appLocalConfig)) {
			$config = $tree->load($appLocalConfig);
		} elseif (file_exists($appConfig)) {
			$config = $tree->load($appConfig);
		} elseif (file_exists($platformConfig)) {
			$config = $tree->load($platformConfig);
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

--source          Use language code as a value. The value can be combined with location code.
                  Default value is en, if the option is not specified.
                  Examples:
                  --source=en-US
                  --source=ru-UA
                  --source=ru
           
--in              Input directory which contains source json files.
                  Default value APP_DIR/text, where APP_DIR is your application folder.
                  Example:
                  --in=/home/user/input
       
--out             Output directory.
                  Default value APP_DIR/translations, where APP_DIR is your application folder.
                  Example:
                  --out=/home/user/output
       
--format          Can be "google" or "human".
                  "google" automatically translates files using Google Translation API.
                  Google API key must be provided in your application config (app.json).
                  "human" prepares files for further human translators.
                  Default value is "google".
                  Examples:
                  --format=google
                  --format=human
                  
--google-format   Google translation format. This option is used along with --format=google.
                  The format of the source text, in either HTML (default) or plain-text.
                  A value of html indicates HTML and a value of text indicates plain-text.
                  Default value is "html".
                  Examples:
                  --google-format=html
                  --google-format=text

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
			case 'google':
				$this->adapter = new Q_Translate_Google($this);
				break;
			case 'human':
				$this->adapter = new Q_Translate_Human($this);
				break;
			default:
				die("Unknown format value\n");
		}
	}

}

