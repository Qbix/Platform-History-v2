<?php

function Q_response_dashboard()
{	
	$app = Q_Config::expect('Q', 'app');
	$slogan = "Powered by Qbix.";
	$user = Users::loggedInUser();
	$text = Q_Text::get("MyApp/dashboard");

	if (Users::loggedInUser(false, false)) {
		$tabs = array('home' => $text["home"]);
	} else {
		$tabs = array('welcome' => $text["welcome"]);
	}
	$tabs = array_merge($tabs, array(
		'about' => $text["about"]
	));
	$urls = array(
		'welcome' => 'MyApp/welcome',
		'home' => 'MyApp/home',
		'about' => 'MyApp/about'
	);
	return Q::view("$app/dashboard.php", compact('slogan', 'user', 'tabs', 'urls', 'text'));
}
