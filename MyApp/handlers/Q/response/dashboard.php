<?php

function Q_response_dashboard()
{	
	$app = Q_Config::expect('Q', 'app');
	$slogan = "Powered by Qbix.";
	$user = Users::loggedInUser();
	if (Users::loggedInUser(false, false)) {
		$tabs = array('home' => 'Home');
	} else {
		$tabs = array('welcome' => 'Welcome');
	}
	$tabs = array_merge($tabs, array(
		'about' => 'About'
	));
	$urls = array(
		'welcome' => 'MyApp/welcome',
		'home' => 'MyApp/home',
		'about' => 'MyApp/about'
	);
	return Q::view("$app/dashboard.php", compact('slogan', 'user', 'tabs', 'urls'));
}
