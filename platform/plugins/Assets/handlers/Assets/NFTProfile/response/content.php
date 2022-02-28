<?php
function Assets_NFTProfile_response_content ($params) {
	$loggedInUser = Users::loggedInUser();
	$r = array_merge($_REQUEST, $params);
	$uri = Q_Dispatcher::uri();
	$loggedInUserId = Q::ifset($loggedInUser, 'id', null);
	$userId = Q::ifset($r, 'userId', Q::ifset($uri, 'userId', $loggedInUser->id));
	if ($userId) {
		$user = Users::fetch($userId, true);
		if (!$user) {
			$user = new Users_User();
			$user->username = $userId;
			if (!$user->retrieve()) {
				$user = null;
			}
		}
	} else {
		$user = Users::loggedInUser(true);
	}

	Q_Response::setScriptData("Assets.NFT.profile.userId", $user->id);

	$self = $loggedInUser->id == $user->id;

	$app = Q::app();
	$defaultSize = Q_Config::expect("Q", "images", "Users/cover", "defaultSize");
	$splitedId = Q_Utils::splitId($user->id, 3, '/');
	$coverUrl = null;
	if (is_file(APP_FILES_DIR . "/" . $app . "/uploads/Users/" . $splitedId . "/cover/" . $defaultSize . ".png")) {
		$coverUrl = Q_Request::baseUrl() . "/Q/uploads/Users/" . $splitedId . "/cover/" . $defaultSize . ".png";
	}

	Q_Response::addScript("{{Assets}}/js/pages/profile.js");
	Q_Response::addStylesheet("{{Assets}}/css/pages/profile.css");

	$communityId = Users::communityId();
	$greeting = Streams::fetchOne(null, $user->id, "Streams/greeting/$communityId");
	$isMobile = Q_Request::isMobile();
	$chains = Assets_NFT::getChains();
	$wallet = Users_Web3::getWalletById($userId, true);
	$tokenJSON = [];

	// get tokens by owner
	foreach ($chains as $chain) {
		$tokens = (int)Users_Web3::execute($chain["contract"], "balanceOf", $wallet, $chain["chainId"]);
		for ($i = 0; $i < $tokens; $i++) {
			$tokenId = (int)Users_Web3::execute($chain["contract"], "tokenOfOwnerByIndex", array($wallet, $i), $chain["chainId"]);
			$tokenURI = Users_Web3::execute($chain["contract"], "tokenURI", $tokenId, $chain["chainId"]);

			// try to request token URI, if response if not valid json - continue
			try {
				$dataJson = Q::json_decode(Q_Utils::get($tokenURI, null, array(
					CURLOPT_SSL_VERIFYPEER => false,
					CURLOPT_SSL_VERIFYHOST => false
				)), true);
			} catch (Exception $e) {
				continue;
			}

			$tokenJSON[$tokenId] = array(
				"tokenId" => $tokenId,
				"chainId" => $chain["chainId"],
				"data" => $dataJson
			);
		}
	}

	/*$tokenJSON = array(
		array("tokenId" => 46, "chainId" => "0x61"),
		array("tokenId" => 71, "chainId" => "0x61"),
		array("tokenId" => 72, "chainId" => "0x61")
	);*/

	$text = Q_Text::get('Assets/content');
	$title = Q::interpolate(Q::ifset($text, "NFT", "profile", "Title", null), array("userName" => $user->displayName()));
	$description = Q::ifset($text, 'profile', 'Description', null);
	$keywords = Q::ifset($text, 'profile', 'Keywords', null);
	$url = implode("/", array(Q_Request::baseUrl(), "profile", $userId));
	$image = Q_Uri::interpolateUrl($user->icon . '/400.png');
	Q_Response::setMeta(array(
		array('attrName' => 'name', 'attrValue' => 'title', 'content' => $title),
		array('attrName' => 'property', 'attrValue' => 'og:title', 'content' => $title),
		array('attrName' => 'property', 'attrValue' => 'twitter:title', 'content' => $title),
		array('attrName' => 'name', 'attrValue' => 'description', 'content' => $description),
		array('attrName' => 'property', 'attrValue' => 'og:description', 'content' => $description),
		array('attrName' => 'property', 'attrValue' => 'twitter:description', 'content' => $description),
		array('attrName' => 'name', 'attrValue' => 'keywords', 'content' => $keywords),
		array('attrName' => 'property', 'attrValue' => 'og:keywords', 'content' => $keywords),
		array('attrName' => 'property', 'attrValue' => 'twitter:keywords', 'content' => $keywords),
		array('attrName' => 'name', 'attrValue' => 'image', 'content' => $image),
		array('attrName' => 'property', 'attrValue' => 'og:image', 'content' => $image),
		array('attrName' => 'property', 'attrValue' => 'twitter:image', 'content' => $image),
		array('attrName' => 'property', 'attrValue' => 'og:url', 'content' => $url),
		array('attrName' => 'property', 'attrValue' => 'twitter:url', 'content' => $url),
		array('attrName' => 'property', 'attrValue' => 'twitter:card', 'content' => 'summary')
	));

	return Q::view('Assets/content/NFTProfile.php', compact(
		"user", "coverUrl", "self", "greeting", "userId", "loggedInUserId",
		"isMobile", "tokenJSON"
	));
}