<?php

function Q_response_dashboard()
{	
	$app = Q::app();
	$slogan = "Powered by Qbix.";
	$user = Users::loggedInUser();
	$text = Q_Text::get("MyApp/content");

	if (Users::loggedInUser(false, false)) {
		$tabs = array('home' => $text['dashboard']["Home"]);
	} else {
		$tabs = array('welcome' => $text['dashboard']["Welcome"]);
	}
	$tabs = array_merge($tabs, array(
		'about' => $text['dashboard']["About"]
	));
	$urls = array(
		'welcome' => 'MyApp/welcome',
		'home' => 'MyApp/home',
		'about' => 'MyApp/about'
	);
	return Q::view("$app/dashboard.php", compact('slogan', 'user', 'tabs', 'urls', 'text'));
}
