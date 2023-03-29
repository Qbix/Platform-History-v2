<?php
function Assets_NFTprofile_response_column (&$params, &$result) {
	$loggedInUser = Users::loggedInUser();
	$request = array_merge($_REQUEST, $params);
	$uri = Q_Dispatcher::uri();
	$loggedInUserId = Q::ifset($loggedInUser, 'id', null);
	$userId = Q::ifset($request, 'userId', Q::ifset($uri, 'userId', $loggedInUser->id));
	$selectedSeriesId = Q::ifset($request, "selectedSeriesId", null);
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

	Q_Response::setScriptData("Q.Assets.NFTprofile.userId", $user->id);

	$self = $loggedInUser->id == $user->id;
	$app = Q::app();
	$communityId = Users::communityId();
	$greeting = Streams_Stream::fetch(null, $user->id, "Streams/greeting/$communityId");

	Q_Response::addScript("{{Assets}}/js/columns/NFTprofile.js");
	Q_Response::addStylesheet("{{Assets}}/css/columns/NFTprofile.css");

	$isMobile = Q_Request::isMobile();

	$xids = array();
	foreach (array('facebook', 'twitter', 'linkedin', 'github', 'instagram') as $item) {
		$value = Q::event('Communities/profileInfo/response/social', array(
			'social' => $item,
			'userId' => $userId,
			'action' => 'get'
		));

		if (!empty($value)) {
			$xids[$item.'/'.$app] = $value;
		}
	}

	// get cover
	$cover = array();
	if ($selectedSeriesId) {
		$selectedSeriesStream = Streams_Stream::fetch(null, $userId, Assets_NFT_Series::$streamType."/".$selectedSeriesId);
		if ($selectedSeriesStream) {
			$cover["url"] = $selectedSeriesStream->iconUrl("x.png");
			$coverFile = Q_Uri::filenameFromUrl($cover["url"]);
			if (!is_file($coverFile)) {
				throw new Exception("cover file not found");
			}
			$cover["mimeType"] = finfo_file(finfo_open(FILEINFO_MIME_TYPE), $coverFile);
		}
	}

	$text = Q_Text::get('Assets/content');
	$title = Q::interpolate(Q::ifset($text, 'profile', 'Title', null), array("userName" => $user->displayName()));
	$description = Q::ifset($text, 'profile', 'Description', null);
	$keywords = Q::ifset($text, 'profile', 'Keywords', null);
	$url = Q_Uri::url("Assets/NFTprofile userId=$userId");
	$image = Q_Uri::interpolateUrl($user->icon.'/400.png');
	Q_Response::setMeta(array(
		array('name' => 'name', 'value' => 'title', 'content' => $title),
		array('name' => 'property', 'value' => 'og:title', 'content' => $title),
		array('name' => 'property', 'value' => 'twitter:title', 'content' => $title),
		array('name' => 'name', 'value' => 'description', 'content' => $description),
		array('name' => 'property', 'value' => 'og:description', 'content' => $description),
		array('name' => 'property', 'value' => 'twitter:description', 'content' => $description),
		array('name' => 'name', 'value' => 'keywords', 'content' => $keywords),
		array('name' => 'property', 'value' => 'og:keywords', 'content' => $keywords),
		array('name' => 'property', 'value' => 'twitter:keywords', 'content' => $keywords),
		array('name' => 'name', 'value' => 'image', 'content' => $image),
		array('name' => 'property', 'value' => 'og:image', 'content' => $image),
		array('name' => 'property', 'value' => 'twitter:image', 'content' => $image),
		array('name' => 'property', 'value' => 'og:url', 'content' => $url),
		array('name' => 'property', 'value' => 'twitter:url', 'content' => $url),
		array('name' => 'property', 'value' => 'twitter:card', 'content' => 'summary')
	));

	$isAdmin = (bool)Users::roles(null, 'Users/admins');
	$chains = Assets_NFT::getChains();
	$defaultChain = Assets_NFT::getDefaultChain($chains);

	$column = Q::view('Assets/column/NFTprofile.php', @compact(
		"user", "self", "greeting", "userId", "loggedInUserId", "cover", "selectedSeriesId",
		"isAdmin", "isMobile", "app", "xids", "followers", "following", "chains", "defaultChain"
	));

	$url = Q_Uri::url("Assets/NFTprofile");
	$columnsStyle = Q_Config::get(
		'Q', 'response', 'layout', 'columns', 'style', 'classic'
	);

	$controls = null;
	/*(if ($columnsStyle == 'classic') {
		$showControls = Q_Config::get('Assets', 'NFTprofile', 'controls', true);
		$controls = $showControls ? Q::view('Assets/controls/NFTprofile.php') : null;
	}*/
	Assets::$columns['NFTprofile'] = array(
		'title' => $title,
		'column' => $column,
		'columnClass' => 'Assets_column_'.$columnsStyle,
		'controls' => $controls,
		'close' => false,
		'url' => $url
	);
	Q_Response::setSlot('controls', $controls);

	return $column;
}

