#!/usr/bin/env php
<?php

include(dirname(__FILE__) . DIRECTORY_SEPARATOR . '../Q.inc.php');

define('API_KEY', Q_Config::get('Translation', 'google', 'key')['key']);
define('SRC_DIR', realpath(dirname(__FILE__) . DIRECTORY_SEPARATOR . '../../text'));

$params = array(
	'h::' => 'help::',
	's::' => 'source::',
	'e::' => 'export::',
	'n::' => 'null::'
);

// Default values
$source = 'en';

$help = <<<EOT
This script automatically translates app interface into different languages.

Use --source=language_code to translate from certain language.
For example, if you have fr.json and you want to translate from it then run: php translate.php --source=fr

Use --export=dir to export translations into specific directory.


EOT;

$options = getopt(implode('', array_keys($params)), $params);

if (isset($options['source'])) {
	$source = $options['source'];
}

define('EXPORT', $options['export'] ? $options['export'] : null);

define('SAVENULL', isset($options['null']));

if (isset($options['help'])) {
	echo $help;
	exit;
}

function getLangSrc($lang, $locale)
{
	$arr = array();
	$objects = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(SRC_DIR, RecursiveDirectoryIterator::SKIP_DOTS), RecursiveIteratorIterator::SELF_FIRST);
	foreach ($objects as $filename => $object) {
		if (basename($filename) === $lang . ($locale ? '-' . $locale : '' ) . '.json') {
			$tree = new Q_Tree();
			$tree->load($filename);
			$all = $tree->getAll();
			$res = array();
			$srcPath = ltrim(str_replace(SRC_DIR, "", $filename), '/');
			flatten($srcPath, $all, $res);
			$arr = array_merge($arr, $res);
		}
	}
	if (!sizeof($arr)) {
		die("No source files found on language: " . $lang. "\n");
	}
	return $arr;
}

function getLocales()
{
	$tree = new Q_Tree();
	$tree->load(Q_CONFIG_DIR . DS . 'Q' . DS . 'locales.json');
	return $tree->getAll();
}

function saveLangJsonFiles($lang, $data)
{
	$jsonFiles = [];
	foreach ($data as $d) {
		$arr =& $jsonFiles[$d['dirname']];
		if (!sizeof($arr)) {
			$arr = [];
		}
		array_push($d['key'], $d['value']);
		$jsonFiles[$d['dirname']] = array_merge_recursive($arr, arrayToBranch($d['key']));
	}
	$filenames = [];
	foreach ($jsonFiles as $dirname => $json) {
		$dirname = (EXPORT ? EXPORT : SRC_DIR) . DS . $dirname . DS;
		if (!is_dir($dirname)) {
			mkdir($dirname, 0755, true);
		}
		$filename = $dirname . $lang . '.json';
		$filenames[] = $filename;
		$fp = fopen($filename, 'w');
		fwrite($fp, json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
		fclose($fp);
	}
	return $filenames;
}

function saveNullFiles($data) {
	$nullFiles = [];
	foreach ($data as $d) {
		$arr =& $nullFiles[$d['dirname']];
		if (!sizeof($arr)) {
			$arr = [];
		}
		array_push($d['key'], null);
		$nullFiles[$d['dirname']] = array_merge_recursive($arr, arrayToBranch($d['key']));
	}
	foreach ($nullFiles as $dirname => $json) {
		$dirname = (EXPORT ? EXPORT : SRC_DIR) . DS . $dirname . DS;
		if (!is_dir($dirname)) {
			mkdir($dirname, 0755, true);
		}
		$fp = fopen($dirname . DS . 'null.json', 'w');
		fwrite($fp, json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
		fclose($fp);
	}
}

function translate($fromLang, $toLang, $data, $chunkSize = 100)
{
	$chunks = array_chunk($data, $chunkSize);
	$translations = [];
	$count = 0;
	foreach ($chunks as $chunk) {
		$qArr = array_map(function ($item) {
			return $item['value'];
		}, $chunk);
		$ch = curl_init('https://translation.googleapis.com/language/translate/v2?key=' . API_KEY);
		curl_setopt_custom_postfields($ch, array("q" => $qArr, "source" => $fromLang, "target" => $toLang, "format" => "html"));
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
	return $data;
}

function flatten($filename, $arr, & $res = null, & $key = [])
{
	foreach ($arr as $itemKey => $item) {
		$key[] = $itemKey;
		if (is_array($item)) {
			flatten($filename, $item, $res, $key);
		} else {
			$res[] = array(
				"dirname" => pathinfo($filename)['dirname'],
				"key" => $key,
				"value" => $item
			);
		}
		array_pop($key);
	}
}

function curl_setopt_custom_postfields($ch, $postfields)
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

function arrayToBranch($arr)
{
	$key = array_shift($arr);
	if (!sizeof($arr)) {
		return $key;
	} else {
		return array($key => arrayToBranch($arr));
	}
}

function translateAll($langLocale)
{
	list($fromLang, $locale) = preg_split( "/(_|-)/", $langLocale);
    $src = getLangSrc($fromLang, $locale);

    if (SAVENULL) {
	    saveNullFiles($src);
	    return;
    }

	$locales = getLocales();

	foreach ($locales as $toLang => $localeNames) {
		if (($toLang === $fromLang) && EXPORT) {
			$res = $src;
		}
		if ($toLang !== $fromLang) {
			$res = translate($fromLang, $toLang, $src);
		}
		$files = saveLangJsonFiles($toLang, $res);
		foreach ($localeNames as $localeName) {
			foreach ($files as $file) {
				copy($file, dirname($file) . DS . $toLang . '-' . $localeName . '.json');
			}
		}
	}
}
Q_Cache::clear(true, false, 'Q_Text::get');
translateAll($source);