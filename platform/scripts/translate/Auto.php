<?php

class Auto {

	function __construct(Translate $parent)
	{
		$this->apiKey = Q_Config::get('Translation', 'google', 'key')['key'];
		$this->parent = $parent;
	}
	
	function saveAll() {
		list($fromLang, $locale) = preg_split("/(_|-)/", $this->parent->options['source']);
		$src = $this->parent->getSrc($fromLang, $locale);
		foreach ($this->parent->locales as $toLang => $localeNames) {
			if (!empty($this->parent->options['in']) && !empty($this->parent->options['out'])) {
				if (($fromLang == $toLang) && ($this->parent->options['in'] === $this->parent->options['out'])) {
					continue;
				}
			}
			if (($toLang === $fromLang) && $this->parent->options['out']) {
				$res = $src;
			}
			if ($toLang !== $fromLang) {
				$res = $this->translate($fromLang, $toLang, $src);
			}
			$files = $this->saveJson($toLang, $res);
			foreach ($localeNames as $localeName) {
				foreach ($files as $file) {
					copy($file, dirname($file) . DS . $toLang . '-' . $localeName . '.json');
				}
			}
		}
	}

	private function saveJson($lang, $data)
	{
		$jsonFiles = [];
		foreach ($data as $d) {
			$arr =& $jsonFiles[$d['dirname']];
			if (!sizeof($arr)) {
				$arr = [];
			}
			array_push($d['key'], $d['value']);
			$jsonFiles[$d['dirname']] = array_merge_recursive($arr, $this->parent->arrayToBranch($d['key']));
		}
		$filenames = [];
		foreach ($jsonFiles as $dirname => $json) {
			$dir = $this->parent->createDirectory($dirname);
			$filename = $this->parent->joinPaths($dir, $lang . '.json');
			$filenames[] = $filename;
			$fp = fopen($filename, 'w');
			fwrite($fp, json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
			fclose($fp);
		}
		return $filenames;
	}

	private function replaceTagsByNumbers($data, $startNumber = 999) {
		for ($i = 0; $i < sizeof($data); $i++) {
			if (preg_match_all("/{{(.*?)}}/", $data[$i]['value'], $matches)) {
				$j = 0;
				foreach($matches[0] as $search) {
					$data[$i]['value'] = str_replace($search, "{{" . ($j + $startNumber) . "}}", $data[$i]['value']);
					$data[$i]['value'];
					$j++;
				}
				$data[$i]['tags'] = $matches[0];
			}
		};
		return $data;
	}

	private function revertTags($data, $startNumber = 999) {
		for ($i = 0; $i < sizeof($data); $i++) {
			if (!empty($data[$i]['tags'])) {
				$j = 0;
				foreach($data[$i]['tags'] as $tag) {
					$data[$i]['value'] = str_replace("{{" . ($j + $startNumber) . "}}", $tag, $data[$i]['value']);
					$j++;
				}
			}
		};
		return $data;
	}

	private function translate($fromLang, $toLang, $data, $chunkSize = 100)
	{
		$data = $this->replaceTagsByNumbers($data);
		$chunks = array_chunk($data, $chunkSize);
		$translations = [];
		$count = 0;
		foreach ($chunks as $chunk) {
			$qArr = array_map(function ($item) {
				return $item['value'];
			}, $chunk);
			$ch = curl_init('https://translation.googleapis.com/language/translate/v2?key=' . $this->apiKey);
			$this->curlSetoptCustomPostfields($ch, array("q" => $qArr, "source" => $fromLang, "target" => $toLang, "format" => "html"));
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
			$response = json_decode(curl_exec($ch), true);
			if (!$response) {
				die('Wrong translation response');
			}
			if ($response['error']) {
				die($response['error']['message']);
			}
			$count += sizeof($chunk);
			echo "Translated " . $count . " queries of " . $toLang . "\n";
			$translations = array_merge($translations, $response['data']['translations']);
			curl_close($ch);
		}
		foreach ($data as $n => & $d) {
			$d['value'] = $translations[$n]['translatedText'];
		}
		$data = $this->revertTags($data);
		return $data;
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