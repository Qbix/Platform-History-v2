<?php

function Q_response_dashboard()
{	
	$app = Q_Config::expect('Q', 'app');
	$slogan = "Powered by Qbix.";
	$user = Users::loggedInUser();
	return Q::view("$app/dashboard.php", compact('slogan', 'user'));
}
