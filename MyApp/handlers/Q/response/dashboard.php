<?php

function Q_response_dashboard()
{	
	$app = Q_Config::expect('Q', 'app');
	$slogan = "Powered by Qbix.";
	$user = Users::loggedInUser();
	if (Users::loggedInUser(false, false)) {
		$tabs = array('welcome' => 'Welcome');
	} else {
		$tabs = array('home' => 'Home');
	}
	$tabs = array_merge($tabs, array(
		'about' => 'About'
	));
	return Q::view("$app/dashboard.php", compact('slogan', 'user', 'tabs'));
}
