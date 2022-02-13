<?php

class   Q_Translate_Google {

	function __construct(Q_Translate $parent)
	{
		$this->apiKey = Q_Config::get('Q', 'translate', 'google', 'key', '');
		$this->parent = $parent;
	}

	function saveAll() {
		$parts = preg_split("/(_|-)/", $this->parent->options['source']);
		$fromLang = $parts[0];
		$locale = count($parts) > 1 ? $parts[1] : null;
		$in = $this->parent->getSrc($fromLang, $locale, true);
		foreach ($this->parent->locales as $toLang => $localeNames) {
			if (($toLang === $fromLang) && $this->parent->options['out']) {
				$res = $in;
			}
			if ($toLang !== $fromLang) {
				$out = $this->parent->getSrc($toLang, $locale, false, $objects);
				echo "Processing $fromLang->$toLang".PHP_EOL;
				$res = $this->translate($fromLang, $toLang, $in, $out);
			}
			$this->saveJson($toLang, $res, $jsonFiles);
			if (!empty($this->parent->options['in']) && !empty($this->parent->options['out'])) {
				if (($fromLang == $toLang)
					&& ($this->parent->options['in'] === $this->parent->options['out'])) {
					foreach ($localeNames as $localeName) {
						$this->saveLocale($toLang, $localeName, $res, $jsonFiles);
					}
					continue;
				}
			}
			if (isset($this->parent->options['locales'])) {
				foreach ($localeNames as $localeName) {
					$this->saveLocale($toLang, $localeName, $res, $jsonFiles);
				}
			}
		}
	}
	
	private function saveLocale($lang, $locale, $res, $jsonFiles)
	{
		foreach ($jsonFiles as $dirname => $content) {
			$directory = $this->parent->createDirectory($dirname);
			$langFile = $directory . DS . "$lang.json";
			$localeFile = $directory . DS . "$lang-$locale.json";
			if (file_exists($localeFile)) {
				$arr = $content;
				$tree = new Q_Tree();
				$tree->load($localeFile);
				$tree->merge($arr);
				$tree->save($localeFile, array(), null, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
			} else {
				copy($langFile, $localeFile);
			}
		}
	}

	private function saveJson($lang, $data, &$jsonFiles)
	{
		$jsonFiles = array();
		foreach ($data as $d) {
			$dirname = $d['dirname'];
			$arr =& $jsonFiles[$dirname];
			if (!$arr or !sizeof($arr)) {
				$arr = array();
			}
			array_push($d['key'], $d['value']);
			$tree = new Q_Tree($arr);
			$tree->merge($this->parent->arrayToBranch($d['key']));
		}
		$filenames = array();
		foreach ($jsonFiles as $dirname => $content) {
			$dir = $this->parent->createDirectory($dirname);
			$filename = $this->parent->joinPaths($dir, $lang . '.json');
			$filenames[] = $filename;
			$fp = fopen($filename, 'w');
			fwrite($fp, json_encode($content, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
			fclose($fp);
		}
		return $filenames;
	}

	private function replaceTagsByNumbers($data, $startNumber = 999) {
		foreach ($data as $k => &$v) {
			if (!preg_match_all("/{{(.*?)}}/", $v['value'], $matches)) {
				continue;
			}
			$j = 0;
			foreach($matches[0] as $search) {
				$v['value'] = str_replace($search, "{{" . ($j + $startNumber) . "}}", $v['value']);
				$v['value'];
				$j++;
			}
			$v['tags'] = $matches[0];
		}
		return $data;
	}

	private function revertTags($data, $startNumber = 999) {
		foreach ($data as $k => &$d) {
			if (empty($d['tags'])) {
				continue;
			}
			$j = 0;
			foreach($d['tags'] as $tag) {
				$d['value'] = str_replace("{{" . ($j + $startNumber) . "}}", $tag, $d['value']);
				$d['value'] = str_replace("({" . ($j + $startNumber) . "}}", $tag, $d['value']);
				$j++;
			}
		};
		return $data;
	}

	private function translate($fromLang, $toLang, $in, &$out = array(), $chunkSize = 100)
	{
		$in = $this->replaceTagsByNumbers($in);
		$in2 = array();
		$rt = Q::ifset($this, 'parent', 'options', 'retranslate', array());
		$rta = Q::ifset($this, 'parent', 'options', 'retranslate-all', null);
		$translateAll = isset($rta);
		$rt = is_array($rt) ? $rt : array($rt);
		foreach ($in as $n => $v) {
			$key = $v['dirname'] . "\t" . implode("\t", $v['key']);
			$key2 = implode("/", $v['key']);
			$doIt = false;
			if (empty($out[$key]) or $translateAll) {
				$doIt = true;
			} else {
				foreach ($rt as $v2) {
					$parts = Q_Utils::explodeEscaped('/', $v2);
					foreach ($parts as $i => $p) {
						if ($v['key'][$i] !== $p) {
							break 2;
						}
					}
					$doIt = true;
				}
			}
			if ($doIt) {
				$v['originalKey'] = $n;
				$in2[] = $v;
			}
		}
		$translations = array();
		if (!$in2) {
			return array();
		}
		$chunks = array_chunk($in2, $chunkSize);
		$count = 0;
		foreach ($chunks as $chunk) {
			$qArr = array_map(function ($item) {
				return $item['value'];
			}, $chunk);
			print "Requesting google translation api\n";
			$ch = curl_init('https://translation.googleapis.com/language/translate/v2?key=' . $this->apiKey);
			$postFields = array("q" => $qArr, "source" => $fromLang, "target" => $toLang, "format" => $this->parent->options['google-format']);
			$this->curlSetoptCustomPostfields($ch, $postFields);
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
			$json = curl_exec($ch);
			$response = json_decode($json, true);
			if (!$response) {
				throw new Q_Exception ("Bad translation response");
			}
			if (!empty($response['error'])) {
				$more = "Make sure you have Q/translate/google/key specified.";
				throw new Q_Exception($response['error']['message'] . ' ' . $more);
			}
			$count += sizeof($chunk);
			echo "Translated " . $count . " queries of " . $toLang . "\n";
			$translations = array_merge($translations, $response['data']['translations']);
			curl_close($ch);
		}
		$res = $out;
		foreach ($in2 as $n => $d) {
			$originalKey = $d['originalKey'];
			$res[$originalKey] = $d;
			$res[$originalKey]['value'] = $translations[$n]['translatedText'];
		}
		return $this->revertTags($res);
	}

	private function curlSetoptCustomPostfields($ch, $postfields)
	{
		$algos = hash_algos();
		$hashAlgo = null;
		foreach (array('sha1', 'md5') as $preferred) {
			if (in_array($preferred, $algos)) {
				$hashAlgo = $preferred;
				break;
			}
		}
		if ($hashAlgo === null) {
			list($hashAlgo) = $algos;
		}
		$boundary =
			'----------------------------' .
			substr(hash($hashAlgo, 'cURL-php-multiple-value-same-key-support' . microtime()), 0, 12);
		$body = array();
		$crlf = "\r\n";
		$fields = array();
		foreach ($postfields as $key => $value) {
			if (is_array($value)) {
				foreach ($value as $v) {
					$fields[] = array($key, $v);
				}
			} else {
				$fields[] = array($key, $value);
			}
		}
		foreach ($fields as $field) {
			list($key, $value) = $field;
			if (strpos($value, '@') === 0) {
				preg_match('/^@(.*?)$/', $value, $matches);
				list($dummy, $filename) = $matches;
				$body[] = '--' . $boundary;
				$body[] = 'Content-Disposition: form-data; name="' . $key . '"; filename="' . basename($filename) . '"';
				$body[] = 'Content-Type: application/octet-stream';
				$body[] = '';
				$body[] = file_get_contents($filename);
			} else {
				$body[] = '--' . $boundary;
				$body[] = 'Content-Disposition: form-data; name="' . $key . '"';
				$body[] = '';
				$body[] = $value;
			}
		}
		$body[] = '--' . $boundary . '--';
		$body[] = '';
		$contentType = 'multipart/form-data; boundary=' . $boundary;
		$content = join($crlf, $body);
		$contentLength = strlen($content);
		curl_setopt($ch, CURLOPT_HTTPHEADER, array(
			'Content-Length: ' . $contentLength,
			'Expect: 100-continue',
			'Content-Type: ' . $contentType,
		));
		curl_setopt($ch, CURLOPT_POSTFIELDS, $content);
	}

}