<?php
require_once USERS_PLUGIN_DIR.'/vendor/autoload.php';
use phpseclib\Math\BigInteger;

function Assets_NFT_response_content ($params) {
	$request = array_merge($_REQUEST, $params);
	$uri = Q_Dispatcher::uri();
	$publisherId = Q::ifset($request, 'publisherId', Q::ifset($uri, 'publisherId', null));
	$streamId = Q::ifset($request, 'streamId', Q::ifset($uri, 'streamId', null));
	$tokenId = Q::ifset($request, 'tokenId', Q::ifset($uri, 'tokenId', null));
	$isJson = preg_match("/\.json$/", $_SERVER["REQUEST_URI"]);

	if (empty($tokenId) && empty($publisherId)) {
		throw new Exception("NFT::view publisherId required!");
	}
	if (empty($tokenId) && empty($streamId)) {
		throw new Exception("NFT::view streamId required!");
	}
	if (empty($tokenId) && empty($publisherId) && empty($streamId)) {
		throw new Exception("NFT::view tokenId required!");
	}

	if ($tokenId) {
		if ($isJson) {
			$tokenId = str_replace(".json", "", $tokenId);
		}

		$decodedToken = Streams::fromHexString($tokenId);
		if (!is_array($decodedToken) || sizeof($decodedToken) != 2) {
			throw new Exception("Invalid token Id");
		}

		$publisherId = $decodedToken[0];
		if (stristr($decodedToken[1], '/') === false) {
			$streamName = "Assets/NFT/".$decodedToken[1];
		} else {
			$temp = explode('/', $decodedToken[1]);
			$seriesStreamName = "Assets/NFT/series/".$temp[0];
			$streamName = "Assets/NFT/".$temp[1];
		}
	} else {
		$streamName = "Assets/NFT/".$streamId;
	}

	$stream = Streams::fetchOne(null, $publisherId, $streamName, true);
	$assetsNFTAttributes = $stream->getAttribute('Assets/NFT/attributes', array());
	if (preg_match("/\.\w{3,4}$/", $stream->icon)) {
		$image = Q::interpolate($stream->icon, array("baseUrl" => Q_Request::baseUrl()));
		$defaultIconSize = '2048';
	} else {
		foreach (array("original", "x") as $size) {
			$image = $stream->iconUrl($size.'.png');
			$defaultIconSize = $size;
			if (is_file(Q_Uri::filenameFromUrl($image))) {
				break;
			}
		}
	}

	if ($isJson) {
		if ($assetsNFTAttributes) {
			foreach ($assetsNFTAttributes as &$arr) {
				if (Q::ifset($arr, 'display_type', null) == 'string') {
					unset($arr['display_type']);
				}
			}
		}

		header("Content-type: application/json");
		echo Q::json_encode(array(
			"name" => $stream->title,
			"description" => $stream->content,
			// "external_url" => $url,
			"image" => $image,
			"animation_url" => $stream->getAttribute("videoUrl"),
			"attributes" => $assetsNFTAttributes,
			"background_color" => '000000',
		), JSON_PRETTY_PRINT);
		Q_Response::layoutView('Q/layout/json.php');
		return '';
	}

	$series = Streams::related(null, $publisherId, $streamName, false, array(
		"type" => Assets_NFT::$relationType,
		"streamsOnly" => true,
		"prefix" => "Assets/NFT/series/"
	));
	if ($series) {
		$lastPart = explode("/", reset($series)->name);
		$lastPart = end($lastPart);
		$params["selectedSeriesId"] = $lastPart;
	}
	$params["stream"] = $stream;
	$params["userId"] = $publisherId;
	Q::event('Assets/NFTprofile/response/column', $params);

	Q::event('Assets/NFT/response/column', $params);

	return Q::view('Assets/content/columns.php');
}