<?php
function Assets_icons_response_content ($params)
{
	Q_Response::addStylesheet("{{Assets}}/css/icons.css");
	Q_Response::addScript("{{Assets}}/js/pages/icons.js");

	return Q::view('Assets/content/icons.php');
}