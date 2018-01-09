<?php

function Users_unsubscribe_response_content()
{
	Q_Response::addScript('{{Users}}/js/UsersUnsubscribe.js', "Users");
	Q_Response::addStylesheet('{{Users}}/css/UsersUnsubscribe.css', "Users");

	// can be "unsubscribe", "login", "unsubscribed"
	$state = Users::loggedInUser() ? "unsubscribe" : "login";

	return Q::view('Users/content/unsubscribe.php', compact("state"));
}