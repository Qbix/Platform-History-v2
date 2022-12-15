<?php
	
function MyApp_about_response_content()
{
	$communityId = Users::currentCommunityId(true);
	Q_Response::addStylesheet("css/pages/about.css");
	return Q::view('MyApp/content/about.php', compact("communityId"));
}