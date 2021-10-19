<?php
	
function Assets_services_response_content()
{
	$communityId = Users::currentCommunityId(true);

	return Q::view('Assets/content/services.php', @compact("communityId"));
}