<?php

/**
 * @property array options
 */
class Q_Translate
{

	private $adapter;

	function __construct($options)
	{
		$this->options = $options;
		$this->initAdapter();
		$this->locales = $this->getLocales();
	}
	
	function saveAll()
	{
		$this->adapter->saveAll();
	}

	function getSrc($lang, $locale, $throwIfMissing = false, &$objects = null)
	{
		$arr = array();
		if (!is_dir($this->options['in'])) {
			if ($throwIfMissing) {
				throw new Q_Exception("No such source directory: " . $this->options['in'] . "\n");
			}
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
		if (!sizeof($arr) and !$throwIfMissing) {
			if ($throwIfMissing) {
				throw new Q_Exception("No source files found for " . $lang . ($locale ? '-' . $locale : '') . "\n");
			}
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

	public function getLocales()
	{
		$appLocalConfig = APP_LOCAL_DIR . DS . 'locales.json';
		$appConfig = APP_CONFIG_DIR . DS . 'locales.json';
		$platformConfig = Q_CONFIG_DIR . DS . 'Q' . DS . 'locales.json';
		$config = null;
		if (!empty($this->options['locales'])) {
			$tree = Q_Tree::createAndLoad($this->options['locales']);
		} else if (file_exists($appLocalConfig)) {
			$tree = Q_Tree::createAndLoad($appLocalConfig);
		} elseif (file_exists($appConfig)) {
			$tree = Q_Tree::createAndLoad($appConfig);
		} elseif (file_exists($platformConfig)) {
			$tree = Q_Tree::createAndLoad($platformConfig);
		}
		if (!$tree) {
			throw new Exception('Empty locales.json');
		}
		return $tree->getAll();
	}

	protected function flatten($filename, $arr, & $res = null, & $key = [])
	{
		foreach ($arr as $itemKey => $item) {
			$key[] = $itemKey;
			if (is_array($item)) {
				$this->flatten($filename, $item, $res, $key);
			} else {
				$pathinfo = pathinfo($filename);
				$dirname = $pathinfo['dirname'];
				$k = $dirname . "\t" . implode("\t", $key);
				$res[$k] = array(
					"filename" => $filename,
					"dirname" => $dirname,
					"key" => $key,
					"value" => $item,
					"original" => $item
				);
			}
			array_pop($key);
		}
	}

	protected function initAdapter()
	{

		switch ($this->options['format'])
		{
			case 'google':
				$this->adapter = new Q_Translate_Google($this);
				break;
			case 'human':
				$this->adapter = new Q_Translate_Human($this);
				break;
			default:
				throw new Q_Exception("Unknown format value\n");
		}
	}

}

