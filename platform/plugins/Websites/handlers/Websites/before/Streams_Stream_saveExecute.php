<?php

function Websites_before_Streams_Stream_saveExecute($params)
{
	$row = $params["row"];
	$inserted = $params["inserted"];
	$query = $params["query"];

	if (!$inserted || empty($row->attributes)) {
		return;
	}

	$attributes = Q::json_decode($row->attributes, true);
	$url = Q::ifset($attributes, "url", null);
	if (!$url) {
		return;
	}

	$cacheRow = new Websites_Webpage();
	$cacheRow->url = $url;
	if (!$cacheRow->retrieve()) {
		return;
	}

	$cacheSubPath = $cacheRow->cache;
	if (empty($cacheSubPath)) {
		return;
	}

	$cacheBaseDir = Websites_File::getCachePath();
	$cachePath = $cacheBaseDir.$cacheSubPath;
	if (!is_file($cachePath)) {
		return;
	}

	$res = Websites_File::saveStreamFile($row, $cachePath);
	$attributes["Q.file.url"] = $res["url"];

	$query->parameters["attributes"] = Q::json_encode($attributes);
	return $query;
}