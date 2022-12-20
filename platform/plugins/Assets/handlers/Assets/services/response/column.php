<?php

function Assets_services_response_column(&$params, &$result)
{
	$communityId = Users::currentCommunityId(true);
	$user = Users::loggedInUser(true);

	$assetsAdmin = (bool)Users::roles(null, array('Users/owners', 'Users/admins'), array(), $user->id);

	if (!$assetsAdmin) {
		throw new Users_Exception_NotAuthorized();
	}

	$text = Q_Text::get('Assets/content');

	$column = Q::view('Assets/content/services.php', @compact("communityId","assetsAdmin", "calendarsAdmin", "calendarsAvailabilitiesOptions", "text"));

	$title = Q::ifset(Assets::$options, 'services', 'title', $text['services']['ManageServices']);
	$url = Q_Uri::url(Q::ifset(Assets::$options, 'services', 'url', "Assets/services"));

	Assets::$columns['services'] = array(
		'title' => $title,
		'column' => $column,
		'columnClass' => 'Assets_column_services',
		'close' => false,
		'url' => $url
	);

	return $column;
}

