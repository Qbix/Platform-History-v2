<?php

function MyApp_welcome_response_content($params)
{
	// Do controller stuff here. Prepare variables
	$tabs = array("foo" => "bar");
	$description = "this is a description";
	Q_Response::addScript('js/pages/welcome.js');
	
	

	// set meta tags
	$communityId = Users::communityId();
	$communityUser = Users_User::fetch($communityId);
	$text = Q_Text::get($communityId.'/content');
	$title = Q::text($text['welcome']['Title'], array($communityId));
	$description = Q::text($text['welcome']['Description'], array($communityId));
	$communityIcon = Q_Uri::interpolateUrl($communityUser->icon.'/400.png');
	$url = Q_Uri::url($communityId.'/welcome');
	Q_Response::setMeta(array(
		array('attrName' => 'name', 'attrValue' => 'title', 'content' => $title),
		array('attrName' => 'property', 'attrValue' => 'og:title', 'content' => $title),
		array('attrName' => 'property', 'attrValue' => 'twitter:title', 'content' => $title),
		array('attrName' => 'name', 'attrValue' => 'description', 'content' => $description),
		array('attrName' => 'property', 'attrValue' => 'og:description', 'content' => $description),
		array('attrName' => 'property', 'attrValue' => 'twitter:description', 'content' => $description),
		array('attrName' => 'name', 'attrValue' => 'image', 'content' => $communityIcon),
		array('attrName' => 'property', 'attrValue' => 'og:image', 'content' => $communityIcon),
		array('attrName' => 'property', 'attrValue' => 'twitter:image', 'content' => $communityIcon),
		array('attrName' => 'property', 'attrValue' => 'og:url', 'content' => $url),
		array('attrName' => 'property', 'attrValue' => 'twitter:url', 'content' => $url),
		array('attrName' => 'property', 'attrValue' => 'twitter:card', 'content' => 'summary'),
		array('attrName' => 'property', 'attrValue' => 'og:type', 'content' => 'website'),
	));
	if ($fbApps = Q_Config::get('Users', 'apps', 'facebook', array())) {
		$app = Q::app();
		$fbApp = isset($fbApps[$app]) ? $fbApps[$app] : reset($fbApps);
		if ($appId = $fbApp['appId']) {
			Q_Response::setMeta(array(
				'attrName' => 'property', 'attrValue' => 'fb:app_id', 'content' => $appId
			));
		}
	}

	return Q::view('MyApp/content/welcome.php', @compact('tabs', 'description'));
}

