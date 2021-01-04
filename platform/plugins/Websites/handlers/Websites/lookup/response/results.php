<?php
function Websites_lookup_response_results ($params) {
	Q_Valid::nonce(true);

	$req = array_merge($_REQUEST, $params);

	$platforms = $req["platforms"];
	$query = $req["query"];

	if (empty($platforms)) {
		throw new Q_Exception_WrongValue(array(
			'field' => 'platforms',
			'range' => "not empty"
		));
	}

	if ($platforms["youtube"]) {
		$apiKey = Q_Config::expect("Websites", "youtube", "keys", "server");
		$endPoint = "https://youtube.googleapis.com/youtube/v3/search";

		$query = array(
			"part" => "snippet",
			"maxResults" => 10,
			"order" => "date",
			"q" => $query,
		);

		$channelId = Q_Config::get("Websites", "youtube", "channelId", null);
		if ($channelId) {
			$query["channelId"] = $channelId;
		}

		if (!function_exists('_return')) {
			function _return ($data) {
				$result = array();

				foreach ($data["items"] as $item) {
					$snippet = $item["snippet"];
					$result[] = array(
						"title" => $snippet["title"],
						"icon" => Q::ifset($snippet, "thumbnails", "default", "url", null),
						"iconBig" => Q::ifset($snippet, "thumbnails", "high", "url", null),
						"iconSmall" => "{{Websites}}/img/icons/Websites/youtube/32.png",
						"description" => $snippet["description"],
						"publishTime" => strtotime(Q::ifset($snippet, "publishTime", Q::ifset($snippet, "publishedAt", "now"))),
						"url" => "https://www.youtube.com/watch?v=".Q::ifset($item, "id", "videoId", null)
					);
				}

				return $result;
			}
		}

		$cacheUrl = $endPoint.'?'.http_build_query($query);

		// check for cache
		$cached = Websites_Webpage::cacheGet($cacheUrl);
		if ($cached) {
			return _return($cached);
		}

		$query["key"] = $apiKey;

		// docs: https://developers.google.com/youtube/v3/docs/search/list
		$youtubeApiUrl = $endPoint.'?'.http_build_query($query);
		$result = Q::json_decode(Q_Utils::get($youtubeApiUrl), true);

		Websites_Webpage::cacheSet($cacheUrl, $result);

		return _return($result);
	}
}