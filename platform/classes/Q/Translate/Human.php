<?php

class Q_Translate_Human {

	function __construct(Q_Translate $parent)
	{
		$this->parent = $parent;
	}
	
	function saveAll()
	{
		list($fromLang, $locale) = preg_split("/(_|-)/", $this->parent->options['source']);
		$src = $this->parent->getSrc($fromLang, $locale);
		foreach ($this->parent->locales as $toLang => $localeNames) {
			$localeNames[] = '';
			foreach($localeNames as $locale) {
				$dest = $this->parent->getSrc($toLang, $locale);
				foreach ($src as $srcVal) {
					foreach ($dest as & $destVal) {
						if (($destVal['key'] === $srcVal['key']) && ($destVal['dirname'] === $srcVal['dirname'])) {
							$destVal['original'] = $srcVal['value'];
						}
					}
					$cond = array_filter($dest, function ($item) use ($srcVal) {
						return (($item['key'] === $srcVal['key']) && ($item['dirname'] === $srcVal['dirname']));
					});
					if (!sizeof($cond)) {
						$srcVal['value'] = null;
						$dest[] = $srcVal;
					}
				}
				$toSave = [];
				$paths = [];
				foreach ($dest as $item) {
					$toSave[$item['dirname']][] = [$item['original'], $item['value']];
					$paths[$item['dirname']][] = $item['key'];
				}
				foreach ($toSave as $dirname => $data) {
					$dir = $this->parent->createDirectory($dirname);
					$filename =$this->parent->joinPaths($dir, $toLang . ($locale ? '-' . $locale : '') . '.human.json');
					$fp = fopen($filename, 'w');
					fwrite($fp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
					fclose($fp);
					$filenamePaths = $this->parent->joinPaths($dir, $toLang . ($locale ? '-' . $locale : '') . '.paths' . '.json');
					$fp = fopen($filenamePaths, 'w');
					fwrite($fp, json_encode($paths[$dirname], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
					fclose($fp);
				}
			}
		}
	}

}